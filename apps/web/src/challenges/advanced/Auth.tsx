import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch, clearSession, getToken, getUser, setSession, type AppUser } from '../../lib/api';

const TASK = `Full authentication against the real practice API:

1. Log in with standard@demo.io / secret123 (POST /auth/login) — you receive a JWT stored in localStorage.
2. Complete the MFA step: fetch a 6-digit code via the "simulated inbox" (GET /auth/otp, like checking your email app) and submit it.
3. In the session panel, open the "Admin area" as a standard user — observe the graceful 403 handling.
4. Log out, then repeat the login as admin@demo.io / admin123 and open the Admin area again.
5. Best practice: in your tests, authenticate ONCE via API, save storageState, and reuse the session in every test. See the reference solution.`;

type Stage = 'login' | 'mfa' | 'session';

export default function Auth() {
  const [stage, setStage] = useState<Stage>(getToken() && getUser() ? 'session' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [inboxCode, setInboxCode] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<AppUser | null>(getUser());
  const [adminResult, setAdminResult] = useState('');

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch<{ token: string; user: AppUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(res.token, res.user);
      setUser(res.user);
      setStage('mfa');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const openInbox = async () => {
    setError('');
    try {
      const res = await apiFetch<{ otp: string }>('/auth/otp');
      setInboxCode(res.otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch code');
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/auth/mfa/verify', { method: 'POST', body: JSON.stringify({ otp }) });
      setStage('session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const openAdmin = async () => {
    setAdminResult('');
    try {
      const stats = await apiFetch<{ articles: number; orders: number; uploads: number }>('/api/admin/stats');
      setAdminResult(`Admin stats — articles: ${stats.articles}, orders: ${stats.orders}, uploads: ${stats.uploads}`);
    } catch (err) {
      setAdminResult(err instanceof Error ? err.message : 'Request failed');
    }
  };

  if (stage === 'session' && user) {
    return (
      <div className="card" data-testid="session-panel">
        <h2>
          Signed in as <span data-testid="session-user">{user.name}</span>{' '}
          <span className="badge intermediate" style={{ textTransform: 'none' }}>{user.role}</span>
        </h2>
        <p className="small muted">
          JWT stored under <code>pph.token</code> in localStorage — inspect it with page.evaluate().
        </p>
        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', margin: '1rem 0' }}>
          <button type="button" className="btn secondary" data-testid="open-admin" onClick={openAdmin}>
            Open Admin area
          </button>
          <button
            type="button"
            className="btn subtle"
            data-testid="logout"
            onClick={() => {
              clearSession();
              setUser(null);
              setAdminResult('');
              setInboxCode('');
              setOtp('');
              setStage('login');
            }}
          >
            Log out
          </button>
        </div>
        <p className="status-region" data-testid="admin-result">
          {adminResult || 'Admin area result appears here.'}
        </p>
      </div>
    );
  }

  if (stage === 'mfa') {
    return (
      <div className="card" style={{ maxWidth: 440 }}>
        <h2>Two-factor verification</h2>
        <p className="small muted">
          We "sent" a 6-digit code to <strong>{user?.email}</strong>. Open the simulated inbox to fetch it.
        </p>
        <button type="button" className="btn subtle" data-testid="open-inbox" onClick={openInbox}>
          📩 Open simulated inbox
        </button>
        {inboxCode && (
          <p className="status-region ok" data-testid="inbox-code">
            Simulated email: your code is <strong>{inboxCode}</strong>
          </p>
        )}
        <form onSubmit={verifyOtp} style={{ marginTop: '1rem' }}>
          <div className="field">
            <label htmlFor="otp">Verification code</label>
            <input id="otp" data-testid="otp-input" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
          </div>
          {error && (
            <p className="error-text" role="alert" data-testid="auth-error">
              {error}
            </p>
          )}
          <button type="submit" className="btn" data-testid="verify-otp" disabled={otp.length !== 6}>
            Verify code
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={login} className="card" style={{ maxWidth: 420 }} data-testid="api-login-form">
      <h2>Log in (real API)</h2>
      <p className="small muted">
        standard@demo.io / secret123 &nbsp;·&nbsp; admin@demo.io / admin123
      </p>
      <div className="field">
        <label htmlFor="auth-email">Email</label>
        <input id="auth-email" type="email" data-testid="auth-email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="auth-password">Password</label>
        <input id="auth-password" type="password" data-testid="auth-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && (
        <p className="error-text" role="alert" data-testid="auth-error">
          {error}
        </p>
      )}
      <button type="submit" className="btn" data-testid="auth-submit">
        Continue
      </button>
    </form>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'auth',
  track: 'advanced',
  title: 'Auth & Sessions',
  summary: 'JWT login via API, MFA with a simulated inbox, role-based access, and storageState session reuse.',
  concepts: ['storageState', 'API login', 'MFA / OTP', 'role-based access', 'localStorage tokens'],
  task: TASK,
  hints: [
    'Authenticate via API in a setup project: const res = await request.post("/auth/login", { data: { email, password } }); then save storageState({ path: "auth.json" }) — every test starts logged in.',
    'The OTP code is retrievable via GET /auth/otp with the bearer token — just like reading it from a test email. Click "Open simulated inbox" in the UI to do the same visually.',
    'For 403 handling: request the admin stats with a standard token and assert the error message appears in the admin-result region.',
  ],
  solution: `import { test, expect } from '@playwright/test';

test('login + MFA through the UI', async ({ page }) => {
  await page.goto('/advanced/auth');
  await page.getByTestId('auth-email').fill('standard@demo.io');
  await page.getByTestId('auth-password').fill('secret123');
  await page.getByTestId('auth-submit').click();

  await page.getByTestId('open-inbox').click();
  const code = (await page.getByTestId('inbox-code').textContent())!.match(/\\d{6}/)![0];
  await page.getByTestId('otp-input').fill(code);
  await page.getByTestId('verify-otp').click();
  await expect(page.getByTestId('session-user')).toHaveText('Sam Standard');
});

test('admin area rejects standard users', async ({ request }) => {
  const login = await request.post('/auth/login', {
    data: { email: 'standard@demo.io', password: 'secret123' },
  });
  const { token } = await login.json();

  const stats = await request.get('/api/admin/stats', {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  expect(stats.status()).toBe(403);
});

test('reuse a session via storageState', async ({ request }) => {
  // once per suite: login via API, then reuse storageState in every test
  const login = await request.post('/auth/login', {
    data: { email: 'admin@demo.io', password: 'admin123' },
  });
  const { token } = await login.json();
  // in real projects: await page.request.storageState({ path: 'auth.json' }) in a setup test
  const stats = await request.get('/api/admin/stats', {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  expect(stats.ok()).toBeTruthy();
});`,
  example: 'examples/advanced/auth.spec.ts',
  path: '/advanced/auth',
};
