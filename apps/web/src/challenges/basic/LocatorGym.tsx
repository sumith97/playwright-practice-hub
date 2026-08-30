import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `On this page, exercise the full locator toolbox:

1. Focus the "Username" input — locate it by its label.
2. Focus the email input — locate it by placeholder text.
3. Click "Sign up" — locate it by role.
4. Click the "Read the docs" link — locate it by text.
5. Click the rocket badge — locate it by its test id.
6. Click the gray target box — it has NO accessible name; use CSS or XPath.
7. There are TWO "Submit" buttons on this page (a strict-mode trap!). Click the one inside the billing form only.
8. Click the shapeless element that can only be identified by its id (XPath territory).`;

function Checklist({ done }: { done: Set<string> }) {
  const items = [
    ['by-label', 'Located by label'],
    ['by-placeholder', 'Located by placeholder'],
    ['by-role', 'Located by role'],
    ['by-text', 'Located by text'],
    ['by-testid', 'Located by test id'],
    ['by-css', 'Located by CSS class'],
    ['strict-mode', 'Disambiguated the two Submit buttons'],
    ['by-xpath', 'Located by id / XPath'],
  ];
  return (
    <ul className="checklist" data-testid="locator-checklist">
      {items.map(([key, label]) => (
        <li key={key} className={done.has(key) ? 'done' : 'pending'}>
          {label}
        </li>
      ))}
    </ul>
  );
}

export default function LocatorGym() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [strictMsg, setStrictMsg] = useState('');

  const mark = (key: string) => setDone((prev) => new Set(prev).add(key));

  return (
    <div>
      <Checklist done={done} />

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginTop: '1rem' }}>
        <div className="card">
          <h3>Form elements</h3>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" data-testid="username-field" onFocus={() => mark('by-label')} />
          </div>
          <div className="field">
            <label htmlFor="email-2">Work email</label>
            <input id="email-2" type="email" placeholder="you@example.com" onFocus={() => mark('by-placeholder')} />
          </div>
          <button type="button" className="btn" data-testid="signup-button" onClick={() => mark('by-role')}>
            Sign up
          </button>
        </div>

        <div className="card">
          <h3>Text &amp; attributes</h3>
          <p>
            <a href="#docs" onClick={(e) => { e.preventDefault(); mark('by-text'); }}>
              Read the docs
            </a>
          </p>
          <button
            type="button"
            className="btn subtle"
            data-testid="launch-badge"
            aria-label="Launch mission"
            title="Launch mission"
            onClick={() => mark('by-testid')}
          >
            🚀 Launch
          </button>
        </div>

        <div className="card">
          <h3>The gray box (no name)</h3>
          <div
            className="target-box"
            style={{ background: '#d9dce8', height: 56, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => mark('by-css')}
          >
            <span aria-hidden="true">…</span>
          </div>
          <p className="small muted" style={{ marginTop: '0.4rem' }}>
            It only has a CSS class <code>target-box</code> — like plenty of real-world markup.
          </p>
        </div>

        <div className="card">
          <h3>Strict mode trap</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <form onSubmit={(e) => e.preventDefault()} aria-label="Shipping form">
              <button type="submit" className="btn subtle" onClick={() => { mark('strict-mode'); setStrictMsg('Clicked the SHIPPING form submit'); }}>
                Submit
              </button>
            </form>
            <form onSubmit={(e) => e.preventDefault()} aria-label="Billing form">
              <button type="submit" className="btn subtle" onClick={() => { mark('strict-mode'); setStrictMsg('Clicked the BILLING form submit'); }}>
                Submit
              </button>
            </form>
          </div>
          <p className="status-region" data-testid="strict-result">
            {strictMsg || 'No submit clicked yet'}
          </p>
        </div>

        <div className="card">
          <h3>XPath territory</h3>
          <span id="xpath-only-target" onClick={() => mark('by-xpath')} style={{ cursor: 'pointer' }} role="presentation">
            ▣ shapeless
          </span>
          <p className="small muted" style={{ marginTop: '0.4rem' }}>
            No role, no name, no class — only <code>#xpath-only-target</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'locator-gym',
  track: 'basics',
  title: 'Locator Gym',
  summary: 'Work out every locator strategy: role, label, placeholder, text, test id, CSS and XPath — plus a strict-mode trap.',
  concepts: ['getByRole', 'getByLabel', 'getByPlaceholder', 'getByText', 'getByTestId', 'CSS & XPath locators', 'strict mode'],
  task: TASK,
  hints: [
    'getByLabel("Username") matches the <label> tied to the input via for/id. getByRole("button", { name: "Sign up" }) is the recommended way to find buttons.',
    'For the two Submit buttons, page.getByRole("button", { name: "Submit" }) matches both and Playwright throws a strict-mode violation. Scope it: page.getByRole("form", { name: "Billing form" }).getByRole("button") or use .first() as a last resort.',
    'The gray box has class "target-box": page.locator(".target-box"). The shapeless element: page.locator("#xpath-only-target").',
  ],
  solution: `test('locate everything in the gym', async ({ page }) => {
  await page.goto('/basics/locator-gym');

  await page.getByLabel('Username').focus();
  await page.getByPlaceholder('you@example.com').focus();
  await page.getByRole('button', { name: 'Sign up' }).click();
  await page.getByText('Read the docs').click();
  await page.getByTestId('launch-badge').click();
  await page.locator('.target-box').click();

  // strict mode: two identical "Submit" buttons — scope to the billing form
  await page.getByRole('form', { name: 'Billing form' }).getByRole('button', { name: 'Submit' }).click();

  await page.locator('#xpath-only-target').click();

  await expect(page.getByTestId('locator-checklist')).toContainText('Located by id / XPath');
});`,
  example: 'examples/basic/locator-gym.spec.ts',
  path: '/basics/locator-gym',
};
