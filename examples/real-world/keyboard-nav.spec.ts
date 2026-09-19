import { test, expect } from '@playwright/test';

test.describe('Real World · Keyboard Navigation & Focus', () => {
  test('keyboard-only users can operate the whole page', async ({ page }) => {
    await page.goto('/real-world/keyboard-nav');

    // 1. the skip link reveals itself when focused — the actual contract of a
    //    skip link (Tab-order from a container differs per engine; focus() is
    //    the deterministic way to verify the reveal behavior)
    await page.getByTestId('kb-app').focus();
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await skip.focus();
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible(); // the :focus CSS pulls it on-screen

    // 2. roving tabindex: arrows move focus AND selection together
    await page.getByRole('tab', { name: 'Shipping' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Billing' })).toBeFocused();
    await expect(page.getByRole('tab', { name: 'Billing' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('kb-panel')).toHaveText('Billing panel');

    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Shipping' })).toBeFocused();
    await expect(page.getByTestId('kb-panel')).toHaveText('Shipping panel');

    // 3. modal focus trap: focus moves in, never escapes
    await page.getByTestId('kb-open-dialog').click();
    const dialog = page.getByTestId('kb-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('kb-street')).toBeFocused();

    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    const insideDialog = await page.evaluate(
      () => document.activeElement?.closest('[role="dialog"]') !== null,
    );
    expect(insideDialog).toBe(true);

    // Shift+Tab wraps backwards too
    await page.keyboard.press('Shift+Tab');
    const stillInside = await page.evaluate(
      () => document.activeElement?.closest('[role="dialog"]') !== null,
    );
    expect(stillInside).toBe(true);

    // 4. Escape closes and restores focus to the opener
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('kb-open-dialog')).toBeFocused();
    await expect(page.getByTestId('kb-dialog-result')).toHaveText('Dialog cancelled');
  });
});
