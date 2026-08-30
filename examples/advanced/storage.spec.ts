import { test, expect } from '@playwright/test';

test.describe('Advanced · Web Storage & Cookies', () => {
  test('theme choice persists across reloads', async ({ page }) => {
    await page.goto('/advanced/storage');

    await page.getByTestId('set-dark').click();
    await expect(page.getByTestId('theme-value')).toHaveText('dark');
    expect(await page.evaluate(() => localStorage.getItem('pph.theme'))).toBe('dark');

    await page.reload();
    await expect(page.getByTestId('theme-demo')).toHaveClass(/dark/);
    await expect(page.getByTestId('visit-count')).toHaveText('2');
  });

  test('seed localStorage with addInitScript before boot', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pph.theme', 'dark');
      localStorage.setItem('pph.visits', '41');
    });
    await page.goto('/advanced/storage');

    await expect(page.getByTestId('theme-demo')).toHaveClass(/dark/);
    await expect(page.getByTestId('visit-count')).toHaveText('42');
  });

  test('cookie consent via context.cookies and clearCookies', async ({ page }) => {
    await page.goto('/advanced/storage');

    await page.getByTestId('accept-cookies').click();
    await expect(page.getByTestId('consent-value')).toHaveText('granted');

    const cookie = (await page.context().cookies()).find((c) => c.name === 'pph_consent');
    expect(cookie?.value).toBe('granted');

    await page.context().clearCookies();
    await page.reload();
    await expect(page.getByTestId('consent-value')).toHaveText('none');
  });

  test('sessionStorage survives reloads but not new contexts', async ({ page, browser }) => {
    await page.goto('/advanced/storage');
    await page.getByTestId('session-note').fill('remember the milk');
    await page.reload();
    await expect(page.getByTestId('note-value')).toHaveText('remember the milk');

    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    await freshPage.goto('/advanced/storage');
    await expect(freshPage.getByTestId('note-value')).toHaveText('(empty)');
    await freshContext.close();
  });
});
