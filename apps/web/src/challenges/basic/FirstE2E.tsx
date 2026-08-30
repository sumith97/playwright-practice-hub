import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Write your first complete end-to-end test against this mini app:

1. The login form below is NOT valid against fake credentials. Log in with email student@hub.dev and password playwright-rocks.
2. Try a wrong password first — assert the "Invalid credentials" error message.
3. After login, assert the dashboard greets you and the activity table lists 3 rows.
4. Log out and confirm you are back on the login form.

This is the classic login-verify-logout skeleton you will reuse everywhere.`;

const CREDENTIALS = { email: 'student@hub.dev', password: 'playwright-rocks' };

const ACTIVITY = [
  { time: '09:12', event: 'Suite green: 32 passed in 1m 41s' },
  { time: '10:03', event: 'Flaky test quarantined: checkout.spec.ts' },
  { time: '11:47', event: 'Trace reviewed: login-failure' },
];

export default function FirstE2E() {
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === CREDENTIALS.email && password === CREDENTIALS.password) {
      setUser('Student');
      setError('');
    } else {
      setError('Invalid credentials — check the task description for the demo login.');
    }
  };

  if (user) {
    return (
      <div>
        <div className="card" data-testid="dashboard">
          <h2 data-testid="welcome-message">Welcome back, {user}!</h2>
          <p className="muted small">Your automation activity this morning:</p>
          <table className="data" data-testid="activity-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITY.map((row) => (
                <tr key={row.time}>
                  <td>{row.time}</td>
                  <td>{row.event}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn secondary" style={{ marginTop: '1rem' }} data-testid="logout-button" onClick={() => { setUser(null); setEmail(''); setPassword(''); }}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={login} className="card" style={{ maxWidth: 420 }} data-testid="login-form">
      <h2>Log in</h2>
      <div className="field">
        <label htmlFor="fe-email">Email</label>
        <input id="fe-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      </div>
      <div className="field">
        <label htmlFor="fe-password">Password</label>
        <input id="fe-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      {error && (
        <p className="error-text" role="alert" data-testid="login-error">
          {error}
        </p>
      )}
      <button type="submit" className="btn" data-testid="login-button">
        Log in
      </button>
    </form>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'first-e2e',
  track: 'basics',
  title: 'First E2E Test',
  summary: 'The classic skeleton: log in, assert the dashboard, log out — including the negative path.',
  concepts: ['full login flow', 'getByLabel', 'role="alert"', 'toHaveCount', 'test skeleton'],
  task: TASK,
  hints: [
    'Fill the form with page.getByLabel("Email").fill("student@hub.dev") and page.getByLabel("Password").fill("playwright-rocks"), then click the Log in button.',
    'The error paragraph has role="alert": page.getByRole("alert") — assert its text after submitting bad credentials.',
    'On the dashboard, table rows are page.getByTestId("activity-table").locator("tbody tr") — assert toHaveCount(3).',
  ],
  solution: `test('login, verify dashboard, log out', async ({ page }) => {
  await page.goto('/basics/first-e2e');

  // negative path first
  await page.getByLabel('Email').fill('student@hub.dev');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid credentials');

  // happy path
  await page.getByLabel('Password').fill('playwright-rocks');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByTestId('welcome-message')).toHaveText('Welcome back, Student!');
  await expect(page.getByTestId('activity-table').locator('tbody tr')).toHaveCount(3);

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByTestId('login-form')).toBeVisible();
});`,
  example: 'examples/basic/first-e2e.spec.ts',
  path: '/basics/first-e2e',
};
