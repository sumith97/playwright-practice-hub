import { test, expect } from '@playwright/test';

test.describe('Advanced · Clock & Timers', () => {
  test('fast-forward five minutes to expire the session', async ({ page }) => {
    await page.clock.install();
    await page.goto('/advanced/clock');

    await expect(page.getByTestId('countdown')).toBeVisible();
    await page.clock.runFor('00:05:01');

    await expect(page.getByTestId('session-expired')).toBeVisible();
    await expect(page.getByTestId('scheduled-message')).toBeVisible();
    await expect(page.getByTestId('scheduled-pending')).toHaveCount(0);
  });

  test('a paused clock makes time fully deterministic', async ({ page }) => {
    await page.clock.pauseAt(new Date('2026-01-01T10:00:00'));
    await page.goto('/advanced/clock');

    await expect(page.getByTestId('live-clock')).toHaveText(/10:00:00/);
    await page.clock.runFor('00:00:30');
    await expect(page.getByTestId('live-clock')).toHaveText(/10:00:30/);
  });

  test('runFor triggers exactly the timers you choose', async ({ page }) => {
    await page.clock.pauseAt(new Date('2026-01-01T09:00:00'));
    await page.goto('/advanced/clock');

    // scheduled message fires at +5s; +4s must NOT trigger it yet
    await page.clock.runFor('00:00:04');
    await expect(page.getByTestId('scheduled-message')).toHaveCount(0);

    await page.clock.runFor('00:00:01');
    await expect(page.getByTestId('scheduled-message')).toBeVisible();
  });
});
