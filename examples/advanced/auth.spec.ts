import { test, expect } from '@playwright/test';
import { loginViaApi } from '../utils';

test.describe('Advanced · Auth & Sessions', () => {

  test('full UI flow: login, MFA via simulated inbox, session, 403, logout', async ({ page }) => {
    await page.goto('/advanced/auth');

    await page.getByTestId('auth-email').fill('standard@demo.io');
    await page.getByTestId('auth-password').fill('secret123');
    await page.getByTestId('auth-submit').click();

    await page.getByTestId('open-inbox').click();
    const inbox = page.getByTestId('inbox-code');
    await expect(inbox).toBeVisible();
    const code = (await inbox.textContent())!.match(/\d{6}/)![0];

    await page.getByTestId('otp-input').fill(code);
    await page.getByTestId('verify-otp').click();

    await expect(page.getByTestId('session-user')).toHaveText('Sam Standard');

    // standard user hits the role gate
    await page.getByTestId('open-admin').click();
    await expect(page.getByTestId('admin-result')).toContainText('Forbidden');

    await page.getByTestId('logout').click();
    await expect(page.getByTestId('api-login-form')).toBeVisible();
  });

  test('bad credentials surface the API error', async ({ page }) => {
    await page.goto('/advanced/auth');
    await page.getByTestId('auth-email').fill('standard@demo.io');
    await page.getByTestId('auth-password').fill('nope');
    await page.getByTestId('auth-submit').click();
    await expect(page.getByTestId('auth-error')).toContainText('Invalid email or password');
  });

  test('admin token unlocks the protected endpoint', async ({ request }) => {
    const session = await loginViaApi(request, { email: 'admin@demo.io', password: 'admin123' });
    const stats = await request.get('/api/admin/stats', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    expect(stats.status()).toBe(200);
    expect(await stats.json()).toMatchObject({ articles: expect.any(Number), orders: expect.any(Number) });
  });

  test('session can be seeded via addInitScript (storageState pattern)', async ({ page, request }) => {
    const session = await loginViaApi(request, { email: 'admin@demo.io', password: 'admin123' });
    await page.addInitScript(
      ([token, user]) => {
        localStorage.setItem('pph.token', token);
        localStorage.setItem('pph.user', JSON.stringify(user));
      },
      [session.token, session.user],
    );

    await page.goto('/advanced/auth');
    await expect(page.getByTestId('session-user')).toHaveText('Ava Admin');
    await page.getByTestId('open-admin').click();
    await expect(page.getByTestId('admin-result')).toContainText('Admin stats');
  });
});
