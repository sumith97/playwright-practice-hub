import { test, expect } from '@playwright/test';

// Visual baselines are generated and committed for Chromium only — comparing
// pixel output across engines is a noise factory, not a signal. (Playwright
// suffixes snapshot files with the browser+platform, so each engine would
// need its own committed baseline set.)
//
// CI note: baselines in this repo were generated on Windows. To enable these
// tests on a Linux CI runner, run once with --update-snapshots there and
// commit the *-linux baselines alongside; until then they skip in CI.
const VISUALS_ENABLED = !process.env.CI;
test.describe('Advanced · Visual Testing', () => {
  test('stable card matches its baseline', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || !VISUALS_ENABLED, 'visual baselines are Chromium-only (and platform-matched)');

    await page.goto('/advanced/visual');
    await expect(page.getByTestId('stable-card')).toHaveScreenshot('stable-card.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('live card compares with dynamic regions masked', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || !VISUALS_ENABLED, 'visual baselines are Chromium-only (and platform-matched)');

    await page.goto('/advanced/visual');
    await expect(page.getByTestId('live-card')).toHaveScreenshot('live-card.png', {
      mask: [page.getByTestId('animated-region'), page.getByTestId('live-clock')],
      maxDiffPixelRatio: 0.02,
    });
  });

  test('full-page gallery comparison', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || !VISUALS_ENABLED, 'visual baselines are Chromium-only (and platform-matched)');

    await page.goto('/advanced/visual');
    await expect(page).toHaveScreenshot('gallery.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      // the full page contains the live clock too — mask it here as well
      mask: [page.getByTestId('animated-region'), page.getByTestId('live-clock')],
    });
  });
});
