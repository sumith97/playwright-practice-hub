import { test, expect } from '@playwright/test';

test.describe('Intermediate · Network Inspection', () => {
  test('real request populates the widget', async ({ page }) => {
    await page.goto('/intermediate/network');
    await page.getByTestId('load-articles').click();

    await expect(page.getByTestId('article-list').locator('li')).toHaveCount(5);
    await expect(page.getByTestId('last-request')).toContainText('200 OK');
  });

  test('route.fulfill mocks the endpoint with our payload', async ({ page }) => {
    await page.goto('/intermediate/network');

    await page.route('**/api/articles', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          articles: [{ id: 'x-1', title: 'Mocked headline', body: 'from route.fulfill', tags: [] }],
          total: 1,
        }),
      }),
    );

    await page.getByTestId('load-articles').click();
    await expect(page.getByTestId('article-list')).toContainText('Mocked headline');
    await expect(page.getByTestId('article-list').locator('li')).toHaveCount(1);
  });

  test('waitForResponse pairs the click with its response', async ({ page }) => {
    await page.goto('/intermediate/network');

    const responsePromise = page.waitForResponse((res) => res.url().includes('/api/slow'));
    await page.getByTestId('load-slow').click();
    const response = await responsePromise;

    expect(response.status()).toBe(200);
    await expect(page.getByTestId('network-status')).toContainText('Slow endpoint answered');
  });

  test('route.abort drives the widget into its error state', async ({ page }) => {
    await page.goto('/intermediate/network');

    await page.route('**/api/slow**', (route) => route.abort('failed'));
    await page.getByTestId('load-slow').click();

    await expect(page.getByTestId('network-widget')).toHaveAttribute('data-status', 'error');
  });
});
