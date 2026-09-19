import { test, expect } from '@playwright/test';

test.describe('Real World · Kata: Fix This Bad Test', () => {
  // The "bad" original lives at examples/real-world/kata/legacy-checkout.kata.ts
  // (never executed in CI). This is the refactored reference version: same
  // journey, zero sleeps, deterministic selection.
  test('legacy checkout, refactored', async ({ page }) => {
    await page.goto('/real-world/refactor-kata');

    // banner arrives late (~900ms): auto-wait, don't sleep
    await expect(page.getByTestId('legacy-banner')).toBeVisible();

    // row order shuffles every load: select by content, scoped to the table
    const graceRow = page.getByTestId('legacy-table').getByRole('row', { name: /Grace Hopper/ });
    await expect(graceRow).toBeVisible();
    await expect(graceRow).toContainText(/orders/);

    // the pay button enables after ~1.5s
    await expect(page.getByTestId('legacy-pay')).toBeEnabled();
    await page.getByTestId('legacy-pay').click();

    // processing -> done (web-first assertion retries through the phase change)
    await expect(page.getByTestId('legacy-status')).toHaveText('Done ✓', { timeout: 5_000 });

    // the toast passes through: catch it, then let it go
    const toast = page.getByTestId('legacy-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/ORD-\d{4}/);
    await expect(toast).toBeHidden({ timeout: 4_000 });

    // the order number survives after the toast vanished
    await expect(page.getByTestId('legacy-last-order')).toContainText(/ORD-\d{4}/);
  });
});
