import { test, expect } from '@playwright/test';

test.describe('Intermediate · Waits & Auto-waiting', () => {
  test('spinner resolves into content without sleeps', async ({ page }) => {
    await page.goto('/intermediate/waits');
    await page.getByTestId('load-content').click();
    await expect(page.getByTestId('loaded-content')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('content-spinner')).toHaveCount(0);
  });

  test('progress bar reaches 100%', async ({ page }) => {
    await page.goto('/intermediate/waits');
    await page.getByTestId('start-progress').click();
    await expect(page.getByTestId('progress-label')).toHaveText('0%', { timeout: 2_000 }).catch(() => undefined);
    await expect(page.getByTestId('progress-label')).toHaveText('100%', { timeout: 10_000 });
  });

  test('transient message appears then disappears', async ({ page }) => {
    await page.goto('/intermediate/waits');
    await page.getByTestId('flash-button').click();
    const flash = page.getByTestId('flash-message');
    await expect(flash).toBeVisible();
    await expect(flash).toBeHidden({ timeout: 6_000 });
  });

  test('slow badge eventually shows', async ({ page }) => {
    await page.goto('/intermediate/waits');
    await expect(page.getByTestId('slow-badge')).toBeVisible({ timeout: 10_000 });
  });

  test('counter polls its way to ten', async ({ page }) => {
    await page.goto('/intermediate/waits');
    await page.getByTestId('start-counter').click();
    await expect
      .poll(async () => page.getByTestId('slow-counter').textContent(), { timeout: 10_000 })
      .toBe('10');
  });
});
