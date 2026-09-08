import { test, expect } from '@playwright/test';

test.describe('Expert · HAR Record & Replay', () => {
  test('record traffic once, then replay it with zero network', async ({ browser }, testInfo) => {
    // offline navigation backed by HAR replay is a Chromium behavior —
    // Firefox/WebKit throw NS_ERROR_OFFLINE before the HAR layer fulfills
    test.skip(testInfo.project.name !== 'chromium', 'offline navigation from HAR is Chromium-only');
    const harPath = testInfo.outputPath('articles.har');

    // phase 1 — record: update mode passes real traffic through and captures it
    const recording = await browser.newContext();
    await recording.routeFromHAR(harPath, { update: true, updateMode: 'full' });
    const page = await recording.newPage();
    await page.goto('/expert/har');
    await page.getByTestId('har-load').click();
    await expect(page.getByTestId('har-list').locator('li')).toHaveCount(5);
    await expect(page.getByTestId('har-status')).toHaveText('Status: success');
    await recording.close(); // the HAR file is written on context close

    // phase 2 — replay: same requests served from the frozen HAR, no network
    const replay = await browser.newContext();
    await replay.routeFromHAR(harPath);
    await replay.setOffline(true);
    const offlinePage = await replay.newPage();

    await offlinePage.goto('/expert/har');
    await offlinePage.getByTestId('har-load').click();
    await expect(offlinePage.getByTestId('har-list').locator('li')).toHaveCount(5);
    await expect(offlinePage.getByTestId('har-status')).toHaveText('Status: success');
    await replay.close();
  });
});
