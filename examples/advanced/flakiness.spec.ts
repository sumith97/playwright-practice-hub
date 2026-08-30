import { test, expect } from '@playwright/test';

test.describe('Advanced · Flakiness Clinic', () => {
  test('assertions survive remounting DOM nodes', async ({ page }) => {
    await page.goto('/advanced/flakiness');

    // locator re-resolves against whatever node currently exists
    await expect(page.getByTestId('phantom-stamp')).toContainText(/generation-\d+/);
    await expect(page.getByTestId('phantom-card').getByRole('button')).toBeVisible();

    // prove a remount happened while the test was running
    await expect
      .poll(async () => Number((await page.getByTestId('generation').textContent())!.match(/\d+/)![0]), {
        timeout: 8_000,
      })
      .toBeGreaterThan(1);
  });

  test('randomly-timed save still reaches the final state', async ({ page }) => {
    await page.goto('/advanced/flakiness');
    await page.getByTestId('unstable-save').click();

    const state = page.getByTestId('save-state');
    await expect(state).toHaveText('Saved! ✓', { timeout: 5_000 });
    await expect(page.getByTestId('unstable-save')).toBeEnabled();
  });

  test('stabilize toggle freezes the phantom card', async ({ page }) => {
    await page.goto('/advanced/flakiness');
    await page.getByTestId('stabilize').check();

    const generation = async () => Number((await page.getByTestId('generation').textContent())!.match(/\d+/)![0]);
    const first = await generation();
    await page.waitForTimeout(2_500);
    expect(await generation()).toBe(first);
  });
});
