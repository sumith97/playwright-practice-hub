import { test, expect } from '@playwright/test';

test.describe('Real World · Performance Smoke Testing', () => {
  test('the page loads within budget', async ({ page }) => {
    await page.goto('/real-world/performance-smoke');

    const duration = await page.evaluate(() =>
      Math.round(performance.getEntriesByType('navigation')[0].duration),
    );
    // generous CI-safe budget — catches "10x slower", not "laptop is warm"
    expect(duration).toBeLessThan(15_000);
    await expect(page.getByTestId('perf-duration')).toContainText(/ms/);
    await expect(page.getByTestId('perf-dcl')).toContainText(/ms/);
  });

  test('loading assets is visible in the resource timeline', async ({ page }) => {
    await page.goto('/real-world/performance-smoke');

    const before = await page.evaluate(() => performance.getEntriesByType('resource').length);
    await page.getByTestId('perf-load-assets').click();

    await expect(page.getByTestId('perf-assets')).toHaveText('Assets loaded this session: 12');
    await expect
      .poll(async () => Number(await page.getByTestId('perf-resources').textContent()))
      .toBeGreaterThanOrEqual(before + 12);

    // transfer size grew too (the assets are no-store, so they always transfer)
    const transferKb = Number((await page.getByTestId('perf-transfer').textContent()).replace(/ KB/, ''));
    expect(transferKb).toBeGreaterThan(0);
  });

  test('engine counters via CDP @smoke', async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== 'chromium', 'CDP Performance.getMetrics is Chromium-only');
    testInfo.annotations.push({ type: 'engine', description: browserName });

    await page.goto('/real-world/performance-smoke');
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    const { metrics } = await client.send('Performance.getMetrics');
    const byName: Record<string, number> = {};
    for (const m of metrics) byName[m.name] = m.value;
    expect(byName.Nodes).toBeGreaterThan(0);
    expect(byName.JSHeapUsedSize).toBeGreaterThan(0);
  });
});
