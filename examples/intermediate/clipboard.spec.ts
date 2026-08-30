import { test, expect } from '@playwright/test';

test.describe('Intermediate · Clipboard & Selection', () => {
  test('copy token, confirm, and read the clipboard back', async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard-read/write permissions are Chromium-only');

    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    await page.goto('/intermediate/clipboard');

    await page.getByTestId('copy-button').click();
    await expect(page.getByTestId('copied-confirmation')).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe('PW-2026-HUB-TOKEN');

    await context.close();
  });

  test('programmatic selection is reported', async ({ page }) => {
    await page.goto('/intermediate/clipboard');
    await page.getByTestId('select-button').click();

    await expect(page.getByTestId('selection-result')).toContainText('Assertions are the heart');
    const selected = await page.evaluate(() => window.getSelection()?.toString());
    expect(selected).toContain('Assertions are the heart');
  });
});
