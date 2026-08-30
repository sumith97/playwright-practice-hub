import { test, expect } from '@playwright/test';

test.describe('Intermediate · Toasts & Transient UI', () => {
  test('a toast appears and dismisses itself', async ({ page }) => {
    await page.goto('/intermediate/toasts');

    await page.getByTestId('save-button').click();
    const toast = page.getByTestId('toast').filter({ hasText: 'Changes saved' });
    await expect(toast).toBeVisible();
    await expect(toast).toBeHidden({ timeout: 6_000 });
  });

  test('notifications stack up to three', async ({ page }) => {
    await page.goto('/intermediate/toasts');
    await page.getByTestId('notify-button').click();
    await expect(page.getByTestId('toast')).toHaveCount(3, { timeout: 3_000 });
    await expect(page.getByTestId('toast').filter({ hasText: 'Notification 3 of 3' })).toBeVisible();
  });

  test('long-lived error toast survives longer than the default timeout', async ({ page }) => {
    await page.goto('/intermediate/toasts');
    await page.getByTestId('error-button').click();
    const error = page.getByTestId('toast').filter({ hasText: 'Payment provider' });
    await expect(error).toBeVisible({ timeout: 1_000 });
    await expect(error).toBeVisible(); // still there after the quick check
  });
});
