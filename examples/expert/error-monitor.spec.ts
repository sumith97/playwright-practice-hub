import { test, expect } from '@playwright/test';

test.describe('Expert · Console & Page-Error Monitoring', () => {
  test('a clean flow produces zero uncaught page errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/expert/error-monitor');
    await page.getByTestId('clean-action').click();
    await page.getByTestId('console-log').click(); // console.log is not an error

    await expect(page.getByTestId('event-feed')).toContainText('hello from the page console');
    await expect(page.getByTestId('clean-count')).toHaveText('Clean actions: 1');
    expect(pageErrors).toEqual([]);
  });

  test('uncaught exceptions are observable — even in timers', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/expert/error-monitor');
    await page.getByTestId('throw-error').click();

    // the exception fires asynchronously inside a setTimeout
    await expect.poll(() => pageErrors.some((m) => m.includes('Explosive'))).toBe(true);
  });

  test('auto fixture: the project-wide "no page errors" policy', async ({ browser }) => {
    // demonstrate the pattern from the challenge: an auto fixture that fails
    // any test whose page produced uncaught errors — in a throwaway context
    const context = await browser.newContext();
    const page = await context.newPage();

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/expert/error-monitor');
    await page.getByTestId('clean-action').click();
    expect(errors, 'uncaught JS errors on the page').toEqual([]);

    await page.getByTestId('throw-error').click();
    await expect.poll(() => errors.length).toBeGreaterThan(0);
    // the fixture would now fail this test — with a readable list of messages
    await context.close();
  });
});
