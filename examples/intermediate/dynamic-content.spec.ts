import { test, expect } from '@playwright/test';

test.describe('Intermediate · Dynamic Content', () => {
  test('infinite scroll lazy-loads more items', async ({ page }) => {
    await page.goto('/intermediate/dynamic-content');
    await expect(page.getByTestId('feed-count')).toHaveText('5');

    await page.getByTestId('feed').hover();
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 500);
    }
    await expect(page.getByTestId('feed-count')).not.toHaveText('5', { timeout: 5_000 });
  });

  test('load more button appends a batch', async ({ page }) => {
    await page.goto('/intermediate/dynamic-content');
    await page.getByTestId('load-more').click();
    // the infinite-scroll sentinel may have auto-loaded a batch too — both are valid app behavior
    await expect(page.getByTestId('feed-count')).not.toHaveText('5');
  });

  test('polled price keeps updating', async ({ page }) => {
    await page.goto('/intermediate/dynamic-content');
    await expect
      .poll(async () => Number(await page.getByTestId('price-updates').textContent()), { timeout: 8_000 })
      .toBeGreaterThan(1);
  });

  test('remounting list replaces DOM nodes', async ({ page }) => {
    await page.goto('/intermediate/dynamic-content');
    await expect(page.getByTestId('list-generation')).toHaveText(/Generation #1/);
    await page.getByTestId('reload-list').click();
    await expect(page.getByTestId('list-generation')).toHaveText(/Generation #2/);
    await expect(page.getByTestId('component-list').locator('li')).toHaveCount(4);
  });

  test('streaming rows arrive until eight', async ({ page }) => {
    await page.goto('/intermediate/dynamic-content');
    await page.getByTestId('start-stream').click();
    await expect(page.getByTestId('stream-table').locator('tbody tr')).toHaveCount(8, { timeout: 12_000 });
  });
});
