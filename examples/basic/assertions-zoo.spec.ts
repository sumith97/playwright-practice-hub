import { test, expect } from '@playwright/test';

test.describe('Basic · Assertions Zoo', () => {
  test('the whole zoo', async ({ page }) => {
    await page.goto('/basics/assertions-zoo');

    await expect(page.getByTestId('status-badge')).toHaveText('Status: active');
    await expect(page.getByTestId('prefilled-input')).toHaveValue('pre-filled');
    await expect(page.getByTestId('inventory-list').locator('li')).toHaveCount(3);

    const secret = page.getByTestId('secret-box');
    await expect(secret).toHaveCount(0);
    await page.getByTestId('reveal-secret').click();
    await expect(secret).toBeVisible();

    await page.getByTestId('toggle-state').click();
    await expect(page.getByTestId('state-pill')).toHaveAttribute('data-status', 'inactive');

    await page.getByTestId('activate-card').click();
    await expect(page.getByTestId('activatable-card')).toHaveClass(/dark/);

    await page.getByTestId('show-summary').click();
    await expect(page).toHaveURL(/\/basics\/assertions-zoo\?tab=summary/);
    await expect(page.getByTestId('tab-param')).toHaveText('summary');

    await page.getByTestId('rename-page').click();
    await expect(page).toHaveTitle('Zoo — Chromacorp');
  });
});
