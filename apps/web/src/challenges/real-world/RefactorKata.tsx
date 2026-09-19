import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Code review, the practice room. Below is a "legacy" widget and, in the repo, a DELIBERATELY BAD test for it (examples/real-world/kata/legacy-checkout.kata.ts — it never runs in CI; copy it into your own suite to start).

The bad test smells: fixed sleeps (waitForTimeout), brittle XPath, .first() on rows whose order shuffles every load, chasing a toast that vanishes, and a click raced against a button that enables late.

1. Run the bad test a few times — watch it flake or crawl (it sleeps > 4 seconds per run).
2. Refactor: auto-waiting assertions instead of sleeps, role/text locators instead of XPath, row-scoped selection by content, and the toast handled with toBeVisible → toBeHidden.
3. The reference solution runs the same journey in well under half the time, deterministically.

The widget's traps are permanent: 900ms late banner, pay button enabling after 1.5s, 700ms processing phase, a 2-second toast, shuffled rows, and a randomized element id.`;

const PEOPLE = ['Ada Byron', 'Grace Hopper', 'Linus Torvalds', 'Radia Perlman'];

export default function RefactorKata() {
  const [banner, setBanner] = useState(false);
  const [payEnabled, setPayEnabled] = useState(false);
  const [status, setStatus] = useState('idle');
  const [toast, setToast] = useState('');
  const [result, setResult] = useState('');

  // rows shuffle on every mount — .first() is a lottery
  const rows = useMemo(() => {
    const shuffled = [...PEOPLE];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // randomized id — XPath-by-generated-id is the classic brittleness
  const randomId = useRef('btn-' + Math.random().toString(36).slice(2, 7)).current;

  useEffect(() => {
    const t1 = window.setTimeout(() => setBanner(true), 900);
    const t2 = window.setTimeout(() => setPayEnabled(true), 1500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const pay = () => {
    setStatus('processing');
    window.setTimeout(() => {
      setStatus('done');
      const orderNo = 'ORD-' + String(Math.floor(1000 + Math.random() * 9000));
      setToast(orderNo);
      setResult(orderNo);
      window.setTimeout(() => setToast(''), 2000);
    }, 700);
  };

  return (
    <div>
      {banner && (
        <p className="status-region ok fade-in" data-testid="legacy-banner">
          Welcome back, valued customer!
        </p>
      )}

      <div className="card">
        <h3>Legacy checkout</h3>
        <table className="data" data-testid="legacy-table" style={{ margin: '0.8rem 0' }}>
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Orders</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((name, i) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{(i * 7 + 3) % 5} orders</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" className="btn subtle" id={randomId} onClick={() => undefined} style={{ marginRight: '0.6rem' }}>
          Legacy action (unstable id)
        </button>
        <button
          type="button"
          className="btn"
          data-testid="legacy-pay"
          disabled={!payEnabled}
          onClick={pay}
        >
          {payEnabled ? 'Pay now' : 'Preparing…'}
        </button>

        <p className="status-region" data-testid="legacy-status">
          {status === 'idle' && 'Awaiting payment.'}
          {status === 'processing' && 'Processing…'}
          {status === 'done' && 'Done ✓'}
        </p>
        {toast && (
          <p className="badge basic" data-testid="legacy-toast" style={{ fontSize: '0.95rem' }}>
            Order {toast} confirmed
          </p>
        )}
        {result && !toast && (
          <p className="small muted" data-testid="legacy-last-order">
            Last order: {result}
          </p>
        )}
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'refactor-kata',
  track: 'real-world',
  title: 'Kata: Fix This Bad Test',
  summary: 'A hostile legacy widget plus a deliberately awful test — refactor it into something fast, deterministic and readable.',
  concepts: ['test smells', 'sleeps → auto-waiting', 'locator strategy', 'row scoping', 'transient elements'],
  task: TASK,
  hints: [
    'waitForTimeout(x) is never the answer: every one of those sleeps has a purpose-built replacement — toBeVisible retries for the banner, toBeEnabled for the pay button, toHaveText for processing → done.',
    'The shuffled rows: select by CONTENT (getByRole("row", { name: /Grace Hopper/ })), never by position. Positional .first() works until the shuffle puts something else first.',
    'The toast disappears after 2s — assert toBeVisible right after the click (web-first assertions catch it in time), then toBeHidden. The last-order line persists if you need a stable fallback.',
    'The randomized id exists to punish XPath-by-id. The buttons have roles and text — use them. Nothing in a good test needs the id at all.',
  ],
  solution: `// the refactored journey — same behavior, no sleeps, deterministic
test('legacy checkout, refactored', async ({ page }) => {
  await page.goto('/real-world/refactor-kata');

  // banner arrives late: retry, don't sleep
  await expect(page.getByTestId('legacy-banner')).toBeVisible();

  // row order shuffles: select by content, scoped to the row
  await expect(
    page.getByTestId('legacy-table').getByRole('row', { name: /Grace Hopper/ }),
  ).toBeVisible();

  // pay button enables after 1.5s
  await expect(page.getByTestId('legacy-pay')).toBeEnabled();
  await page.getByTestId('legacy-pay').click();

  // processing -> done, and the toast passes through
  await expect(page.getByTestId('legacy-status')).toHaveText('Done ✓', { timeout: 5_000 });
  const toast = page.getByTestId('legacy-toast');
  await expect(toast).toBeVisible();
  await expect(toast).toBeHidden({ timeout: 4_000 });

  // the order number survives on the page after the toast is gone
  await expect(page.getByTestId('legacy-last-order')).toContainText(/ORD-\\d{4}/);
});`,
  example: 'examples/real-world/refactor-kata.spec.ts',
  path: '/real-world/refactor-kata',
};
