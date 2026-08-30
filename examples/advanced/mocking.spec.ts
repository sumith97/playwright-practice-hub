import { test, expect } from '@playwright/test';

test.describe('Advanced · Network Mocking & HAR', () => {
  test('a fulfilled 500 drives the graceful error state', async ({ page }) => {
    await page.route('**/api/articles', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      }),
    );

    await page.goto('/advanced/mocking');
    await page.getByTestId('load-data').click();

    await expect(page.getByTestId('mocking-widget')).toHaveAttribute('data-status', 'error');
    await expect(page.getByTestId('error-state')).toContainText('Internal server error');
    await expect(page.getByTestId('last-status')).toContainText('failed');
  });

  test('injected latency exposes the skeleton before the data', async ({ page }) => {
    await page.route('**/api/articles', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });

    await page.goto('/advanced/mocking');
    await page.getByTestId('load-data').click();

    await expect(page.getByTestId('skeleton-list')).toBeVisible();
    await expect(page.getByTestId('mocking-widget')).toHaveAttribute('data-status', 'loading');
    await expect(page.getByTestId('mocking-widget')).toHaveAttribute('data-status', 'success', { timeout: 5_000 });
    await expect(page.getByTestId('articles').locator('li')).toHaveCount(5);
  });

  test('setOffline toggles the offline banner', async ({ page }) => {
    await page.goto('/advanced/mocking');
    await expect(page.getByTestId('offline-banner')).toHaveCount(0);

    await page.context().setOffline(true);
    await expect(page.getByTestId('offline-banner')).toBeVisible();

    await page.context().setOffline(false);
    await expect(page.getByTestId('offline-banner')).toBeHidden();
  });

  test('unauthenticated protected call surfaces the 401', async ({ page }) => {
    await page.goto('/advanced/mocking');
    await page.getByTestId('call-protected').click();

    await expect(page.getByTestId('last-status')).toContainText('GET /api/admin/stats → 401');
    await expect(page.getByTestId('mocking-widget')).toHaveAttribute('data-status', 'error');
    await expect(page.getByTestId('error-state')).toContainText('401');
  });
});
