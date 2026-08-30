import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `One page, every assertion. Using web-first assertions (expect(locator).toBe…):

1. Assert the status badge shows exactly "Status: active".
2. Assert the pre-filled input has the value "pre-filled".
3. Assert the inventory list has exactly 3 items.
4. Click "Reveal secret" and assert the hidden box becomes visible.
5. Click "Toggle state" and assert data-status flips to "inactive".
6. Click "Activate card" and assert the card gets the "active" CSS class.
7. Click "Show summary tab" and assert the page URL contains ?tab=summary.
8. Click "Rename page" and assert the document title becomes "Zoo — Chromacorp".`;

const INVENTORY = ['Sprocket', 'Widget', 'Gizmo'];

export default function AssertionsZoo() {
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState('active');
  const [cardActive, setCardActive] = useState(false);
  const [title, setTitle] = useState('Assertions Zoo');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = title;
    return () => {
      document.title = 'Playwright Practice Hub';
    };
  }, [title]);

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
      <div className="card">
        <h3>Text</h3>
        <p className="badge basic" data-testid="status-badge" style={{ fontSize: '0.95rem' }}>
          Status: active
        </p>
      </div>

      <div className="card">
        <h3>Value</h3>
        <div className="field">
          <label htmlFor="prefilled">Pre-filled input</label>
          <input id="prefilled" type="text" readOnly value="pre-filled" data-testid="prefilled-input" />
        </div>
      </div>

      <div className="card">
        <h3>Count</h3>
        <ul data-testid="inventory-list">
          {INVENTORY.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Visibility</h3>
        <button type="button" className="btn subtle" data-testid="reveal-secret" onClick={() => setRevealed(true)}>
          Reveal secret
        </button>
        {revealed && (
          <p data-testid="secret-box" className="fade-in" style={{ marginTop: '0.5rem' }}>
            🔐 The secret is: always assert, never sleep.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Attribute</h3>
        <p data-testid="state-pill" data-status={status} style={{ fontWeight: 700 }}>
          state pill
        </p>
        <button
          type="button"
          className="btn subtle"
          data-testid="toggle-state"
          onClick={() => setStatus((s) => (s === 'active' ? 'inactive' : 'active'))}
        >
          Toggle state
        </button>
      </div>

      <div className="card">
        <h3>CSS class</h3>
        <div className={`theme-demo ${cardActive ? 'dark' : 'light'}`} data-testid="activatable-card" style={{ marginBottom: '0.5rem' }}>
          {cardActive ? 'Active card' : 'Inactive card'}
        </div>
        <button type="button" className="btn subtle" data-testid="activate-card" onClick={() => setCardActive((v) => !v)}>
          Activate card
        </button>
      </div>

      <div className="card">
        <h3>URL</h3>
        <p className="small muted">
          Current tab param: <code data-testid="tab-param">{searchParams.get('tab') ?? 'none'}</code>
        </p>
        <button type="button" className="btn subtle" data-testid="show-summary" onClick={() => setSearchParams({ tab: 'summary' })}>
          Show summary tab
        </button>
      </div>

      <div className="card">
        <h3>Page title</h3>
        <button type="button" className="btn subtle" data-testid="rename-page" onClick={() => setTitle('Zoo — Chromacorp')}>
          Rename page
        </button>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'assertions-zoo',
  track: 'basics',
  title: 'Assertions Zoo',
  summary: 'A page crafted for every web-first assertion: text, value, count, visibility, attributes, classes, URL and title.',
  concepts: ['toHaveText', 'toHaveValue', 'toHaveCount', 'toBeVisible / toBeHidden', 'toHaveAttribute', 'toHaveClass', 'toHaveURL', 'toHaveTitle'],
  task: TASK,
  hints: [
    'Exact text: expect(page.getByTestId("status-badge")).toHaveText("Status: active") — it normalizes whitespace automatically.',
    'Data attributes: expect(page.getByTestId("state-pill")).toHaveAttribute("data-status", "inactive"). CSS class: expect(...).toHaveClass(/active/).',
    'URL and title are page-level: expect(page).toHaveURL(/tab=summary/) and expect(page).toHaveTitle("Zoo — Chromacorp").',
  ],
  solution: `test('the whole zoo', async ({ page }) => {
  await page.goto('/basics/assertions-zoo');

  await expect(page.getByTestId('status-badge')).toHaveText('Status: active');
  await expect(page.getByTestId('prefilled-input')).toHaveValue('pre-filled');
  await expect(page.getByTestId('inventory-list').locator('li')).toHaveCount(3);

  const secret = page.getByTestId('secret-box');
  await expect(secret).toBeHidden();
  await page.getByTestId('reveal-secret').click();
  await expect(secret).toBeVisible();

  await page.getByTestId('toggle-state').click();
  await expect(page.getByTestId('state-pill')).toHaveAttribute('data-status', 'inactive');

  await page.getByTestId('activate-card').click();
  await expect(page.getByTestId('activatable-card')).toHaveClass(/dark/);

  await page.getByTestId('show-summary').click();
  await expect(page).toHaveURL(/basics\\/assertions-zoo\\?tab=summary/);

  await page.getByTestId('rename-page').click();
  await expect(page).toHaveTitle('Zoo — Chromacorp');
});`,
  example: 'examples/basic/assertions-zoo.spec.ts',
  path: '/basics/assertions-zoo',
};
