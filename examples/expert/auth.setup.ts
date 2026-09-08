import { test as setup } from '@playwright/test';
import { STANDARD_USER } from '../utils';

/**
 * Runs as the dedicated 'setup' project (see playwright.config.ts): logs in
 * once via the API, seeds the SPA's localStorage session, and saves the full
 * browser state — cookies AND localStorage — to be reused by dependent tests.
 */
const authFile = 'examples/expert/.auth/user.json';

setup('authenticate', async ({ page, request }) => {
  const res = await request.post('/auth/login', { data: STANDARD_USER });
  if (!res.ok()) throw new Error(`setup login failed: ${res.status()}`);
  const { token, user } = await res.json();

  // boot the SPA so localStorage exists, then inject the session
  await page.goto('/advanced/auth');
  await page.evaluate(
    ([t, u]) => {
      localStorage.setItem('pph.token', t);
      localStorage.setItem('pph.user', JSON.stringify(u));
    },
    [token, user],
  );

  await page.context().storageState({ path: authFile });
});
