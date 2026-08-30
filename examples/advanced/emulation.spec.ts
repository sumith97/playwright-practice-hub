import { test, expect, devices } from '@playwright/test';

test.use({
  permissions: ['geolocation'],
  geolocation: { latitude: 52.373, longitude: 4.892 },
});

test.describe('Advanced · Emulation & Permissions', () => {
  test('granted geolocation reports the faked coordinates', async ({ page }) => {
    await page.goto('/advanced/emulation');
    await page.getByTestId('request-location').click();
    await expect(page.getByTestId('geo-result')).toContainText('52.3730, 4.8920');
  });

  test('color scheme emulation flips live', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/advanced/emulation');
    await expect(page.getByTestId('color-scheme')).toContainText('dark');

    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.getByTestId('color-scheme')).toContainText('light');
  });

  test('iPhone 13 device descriptor drives the viewport', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await context.newPage();
    await page.goto('/advanced/emulation');

    await expect(page.getByTestId('viewport-readout')).toHaveText(/390 × \d+ px/);
    await context.close();
  });

  test('german locale formats numbers differently', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'de-DE' });
    const page = await context.newPage();
    await page.goto('/advanced/emulation');

    await expect(page.getByTestId('locale-readout')).toHaveText('de-DE');
    await expect(page.getByTestId('number-readout')).toHaveText('0,99');
    await context.close();
  });

  test('timezoneId changes the resolved zone', async ({ browser }) => {
    const context = await browser.newContext({ timezoneId: 'Europe/Berlin' });
    const page = await context.newPage();
    await page.goto('/advanced/emulation');

    await expect(page.getByTestId('timezone-readout')).toHaveText('Europe/Berlin');
    await context.close();
  });
});
