import { test, expect } from '@playwright/test';

test.describe('Expert · Network Surgery', () => {
  test('patch the real response instead of faking it', async ({ page }) => {
    await page.route('**/api/products', async (route) => {
      const response = await route.fetch(); // the real request still happens
      const json = await response.json();
      json.products[0].name += ' (BETA)';
      await route.fulfill({ response, json }); // original headers/status, patched body
    });

    await page.goto('/expert/network-surgery');
    await page.getByTestId('surgery-load').click();
    await expect(page.getByTestId('product-first-name')).toHaveText(/\(BETA\)$/);
    await expect(page.getByTestId('surgery-status')).toHaveText('Status: success');
  });

  test('times: mock only the first two loads, then let reality through', async ({ page }) => {
    await page.route(
      '**/api/products',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            products: [{ id: 'x', name: 'MOCKED', priceCents: 1, category: 'mock', emoji: '🧪' }],
          }),
        });
      },
      { times: 2 },
    );

    await page.goto('/expert/network-surgery');
    const firstName = page.getByTestId('product-first-name');

    await page.getByTestId('surgery-load').click();
    await expect(firstName).toHaveText('MOCKED');

    await page.getByTestId('surgery-load').click();
    await expect(firstName).toHaveText('MOCKED');

    // the { times: 2 } budget is exhausted — the third load hits the real API
    await page.getByTestId('surgery-load').click();
    await expect(firstName).not.toHaveText('MOCKED');
    await expect(page.getByTestId('surgery-loads')).toHaveText('Loads this session: 3');
  });

  test('fallback chains handlers (they run in LIFO order)', async ({ page }) => {
    // registered FIRST -> runs LAST: defers to the next matching handler
    await page.route('**/api/products', (route) => route.fallback());

    // registered SECOND -> runs FIRST: patches the real response
    await page.route('**/api/products', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.products[0].name += ' (via fallback)';
      await route.fulfill({ response, json });
    });

    await page.goto('/expert/network-surgery');
    await page.getByTestId('surgery-load').click();
    await expect(page.getByTestId('product-first-name')).toHaveText(/via fallback/);
  });
});
