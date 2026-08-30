import { useMemo, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Fill in the signup form below:

1. Try submitting an empty form — the button is disabled until the form is valid (assert toBeDisabled / toBeEnabled).
2. Enter a name, a valid email, a password of 8+ characters containing a digit, the same confirmation, and accept the terms.
3. Watch the inline validation messages appear and disappear as you type.
4. Submit and assert the success panel.

Suggested invalid inputs to test first: name "A", email "not-an-email", password "short".`;

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

export default function FormValidation() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const errors = useMemo<Errors>(() => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (password.length < 8 || !/\d/.test(password)) e.password = 'Password needs 8+ characters and at least one digit';
    if (confirm !== password || !confirm) e.confirm = 'Passwords must match';
    if (!terms) e.terms = 'You must accept the terms';
    return e;
  }, [name, email, password, confirm, terms]);

  const valid = Object.keys(errors).length === 0;

  if (submittedName !== null) {
    return (
      <div>
        <div className="card" data-testid="signup-success" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--green)' }}>🎉 Welcome aboard, {submittedName}!</h2>
          <p>Your account has been created (client-side simulation — no data leaves the browser).</p>
          <button type="button" className="btn secondary" data-testid="signup-again" onClick={() => setSubmittedName(null)}>
            Fill the form again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); if (valid) setSubmittedName(name.trim()); }} data-testid="signup-form">
      <div className="field">
        <label htmlFor="su-name">Full name</label>
        <input id="su-name" type="text" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} className={errors.name ? 'input-error' : ''} />
        {errors.name && <p className="error-text" data-testid="error-name">{errors.name}</p>}
      </div>
      <div className="field">
        <label htmlFor="su-email">Email</label>
        <input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={errors.email ? 'input-error' : ''} />
        {errors.email && <p className="error-text" data-testid="error-email">{errors.email}</p>}
      </div>
      <div className="field">
        <label htmlFor="su-password">Password</label>
        <input id="su-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={errors.password ? 'input-error' : ''} />
        {errors.password && <p className="error-text" data-testid="error-password">{errors.password}</p>}
      </div>
      <div className="field">
        <label htmlFor="su-confirm">Confirm password</label>
        <input id="su-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={errors.confirm ? 'input-error' : ''} />
        {errors.confirm && <p className="error-text" data-testid="error-confirm">{errors.confirm}</p>}
      </div>
      <div className="field">
        <label>
          <input type="checkbox" data-testid="terms-checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> I accept the
          terms of service
        </label>
        {errors.terms && <p className="error-text" data-testid="error-terms">{errors.terms}</p>}
      </div>
      <button type="submit" className="btn" data-testid="signup-submit" disabled={!valid}>
        Create account
      </button>
      <p className="small muted" style={{ marginTop: '0.6rem' }} data-testid="validity-hint">
        {valid ? 'Form is valid — submit enabled.' : 'Form is invalid — submit disabled.'}
      </p>
    </form>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'form-validation',
  track: 'basics',
  title: 'Form Validation',
  summary: 'Fill a real form, assert inline validation errors, the disabled submit button, and the success state.',
  concepts: ['fill', 'check', 'toBeDisabled / toBeEnabled', 'toHaveValue', 'asserting error messages', 'web-first assertions'],
  task: TASK,
  hints: [
    'The submit button is disabled until every field is valid: expect(page.getByTestId("signup-submit")).toBeDisabled() on a fresh page.',
    'Fill fields with locator.fill("Ada Lovelace"). Email validation is strict: needs something@domain.tld. Password needs a digit.',
    'Error messages have stable test ids: page.getByTestId("error-email"). Assert text: expect(...).toHaveText("Enter a valid email address"). They appear and disappear as you fix fields — web-first assertions retry automatically.',
  ],
  solution: `test('signup form validation', async ({ page }) => {
  await page.goto('/basics/form-validation');
  const submit = page.getByTestId('signup-submit');
  await expect(submit).toBeDisabled();

  await page.getByLabel('Full name').fill('A');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Password').fill('short');
  await expect(page.getByTestId('error-name')).toBeVisible();
  await expect(page.getByTestId('error-email')).toHaveText('Enter a valid email address');

  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@analytical.engine');
  await page.getByLabel('Password').fill('en1gm4tic');
  await page.getByLabel('Confirm password').fill('en1gm4tic');
  await page.getByTestId('terms-checkbox').check();

  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByTestId('signup-success')).toContainText('Welcome aboard, Ada Lovelace!');
});`,
  example: 'examples/basic/form-validation.spec.ts',
  path: '/basics/form-validation',
};
