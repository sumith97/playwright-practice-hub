import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { STANDARD_USER } from '../utils';

const authFile = 'examples/expert/.auth/user.json';

test.describe('Expert · Setup Project & storageState', () => {
  // The 'chromium' project normally creates this file via its 'setup'
  // dependency. Firefox/WebKit don't depend on it (and may start before it),
  // so self-heal here to keep every project order working.
  test.beforeAll(async ({ browser, request }) => {
    if (existsSync(authFile)) return;

    const res = await request.post('/auth/login', { data: STANDARD_USER });
    const { token, user } = await res.json();

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/advanced/auth');
    await page.evaluate(
      ([t, u]) => {
        localStorage.setItem('pph.token', t);
        localStorage.setItem('pph.user', JSON.stringify(u));
      },
      [token, user],
    );
    await ctx.storageState({ path: authFile });
    await ctx.close();
  });

  test('a context restored from storageState is born logged in', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();

    await page.goto('/expert/setup-auth');
    await expect(page.getByTestId('protected-user')).toHaveText('Sam Standard');
    await expect(page.getByTestId('protected-locked')).toHaveCount(0);

    await context.close();
  });

  test('a fresh context stays locked — no session leakage', async ({ browser }) => {
    const context = await browser.newContext(); // no storageState
    const page = await context.newPage();

    await page.goto('/expert/setup-auth');
    await expect(page.getByTestId('protected-locked')).toBeVisible();
    await expect(page.getByTestId('protected-user')).toHaveCount(0);

    await context.close();
  });
});
