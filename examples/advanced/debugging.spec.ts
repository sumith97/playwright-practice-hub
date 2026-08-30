import { test, expect } from '@playwright/test';

test.describe('Advanced · Debugging, Tracing & CI', () => {
  test('flaky endpoint succeeds within a bounded retry loop', async ({ page }) => {
    await page.goto('/advanced/debugging');

    for (let attempt = 0; attempt < 5; attempt++) {
      await page.getByTestId('run-flaky').click();
      try {
        await expect(page.getByTestId('flaky-result')).toContainText('succeeded', { timeout: 3_000 });
        break;
      } catch {
        // attempt consumed one of the endpoint's forced failures — retry
      }
    }
    await expect(page.getByTestId('flaky-result')).toContainText('succeeded');
  });

  test('late widget arrives through auto-waiting', async ({ page }) => {
    await page.goto('/advanced/debugging');
    await expect(page.getByTestId('late-widget')).toBeVisible({ timeout: 5_000 });
  });

  test('soft assertions collect every mismatch instead of stopping at the first', async ({ page }) => {
    await page.goto('/advanced/debugging');

    // these all pass, but the pattern matters: soft failures accumulate
    expect.soft(await page.getByTestId('long-list').locator('li').count()).toBe(30);
    expect.soft(await page.getByTestId('attempt-count').textContent()).toContain('Clicks');
    await expect(page.getByTestId('late-widget')).toBeVisible({ timeout: 5_000 });
  });

  test('full-page screenshot captures the entire long list', async ({ page }, testInfo) => {
    await page.goto('/advanced/debugging');
    await page.getByTestId('long-list').scrollIntoViewIfNeeded();

    await page.screenshot({ path: testInfo.outputPath('debugging-page.png'), fullPage: true });
    await expect(page.getByTestId('long-list').locator('li')).toHaveCount(30);
  });
});
