import { test, expect } from '@playwright/test';

test.describe('Intermediate · Windows & Popups', () => {
  test('target=_blank opens a catchable new tab', async ({ page }) => {
    await page.goto('/intermediate/windows-popups');

    const tabPromise = page.waitForEvent('popup');
    await page.getByTestId('open-tab-link').click();
    const tab = await tabPromise;

    await expect(tab).toHaveURL(/pop\.html\?kind=tab/);
    await expect(tab).toHaveTitle('Popup');
    await expect(tab.locator('#popup-title')).toHaveText('New tab page');
    await tab.close();
  });

  test('window.open popup greets the opener', async ({ page }) => {
    await page.goto('/intermediate/windows-popups');

    const popupPromise = page.waitForEvent('popup');
    await page.getByTestId('open-popup-button').click();
    const popup = await popupPromise;

    await expect(popup).toHaveTitle('Popup');
    await popup.getByRole('button', { name: 'Send greeting to opener' }).click();
    await expect(popup.locator('#popup-status')).toContainText('Greeting sent');
    await expect(page.getByTestId('greeting-region')).toContainText('Hi from the popup page!');
  });
});
