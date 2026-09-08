import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Make "no JS errors during a user flow" an assertable fact:

1. Collect page errors with page.on('pageerror') and console noise with page.on('console').
2. Run the CLEAN flow ("Do a clean action" + "Log to console") and assert zero uncaught page errors — console.log is fine, uncaught exceptions are not.
3. Now click "Throw uncaught error" and observe that pageerror catches it (the app keeps running — uncaught errors in timers/promises rarely stop the page, which is why they slip through manual QA).
4. Learn the golden pattern from the reference test: an auto fixture that fails ANY test whose page produced uncaught errors.`;

interface FeedEntry {
  kind: 'console' | 'pageerror' | 'action';
  text: string;
}

export default function ErrorMonitor() {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [cleanCount, setCleanCount] = useState(0);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args: unknown[]) => {
      setFeed((f) => [...f.slice(-9), { kind: 'console', text: args.map(String).join(' ') }]);
      originalLog(...args);
    };
    console.error = (...args: unknown[]) => {
      setFeed((f) => [...f.slice(-9), { kind: 'console', text: args.map(String).join(' ') }]);
      originalError(...args);
    };
    // uncaught exceptions surface as the window "error" event (Playwright's
    // page.on("pageerror") wraps exactly this)
    const onError = (event: ErrorEvent) => {
      setFeed((f) => [...f.slice(-9), { kind: 'pageerror', text: event.message }]);
    };
    window.addEventListener('error', onError);
    return () => {
      console.log = originalLog;
      console.error = originalError;
      window.removeEventListener('error', onError);
    };
  }, []);

  const push = (entry: FeedEntry) => setFeed((f) => [...f.slice(-9), entry]);

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
      <div className="card">
        <h3>Buttons of destiny</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn"
            data-testid="clean-action"
            onClick={() => {
              setCleanCount((c) => c + 1);
              push({ kind: 'action', text: 'clean action performed' });
            }}
          >
            Do a clean action
          </button>
          <button
            type="button"
            className="btn subtle"
            data-testid="console-log"
            onClick={() => console.log('hello from the page console')}
          >
            Log to console
          </button>
          <button
            type="button"
            className="btn subtle"
            data-testid="console-error"
            onClick={() => console.error('a console.error message')}
          >
            Log console.error
          </button>
          <button
            type="button"
            className="btn danger"
            data-testid="throw-error"
            onClick={() => {
              setTimeout(() => {
                throw new Error('Explosive button: uncaught page error');
              }, 0);
            }}
          >
            Throw uncaught error
          </button>
        </div>
        <p className="small muted" style={{ marginTop: '0.7rem' }} data-testid="clean-count">
          Clean actions: {cleanCount}
        </p>
      </div>

      <div className="card">
        <h3>Event feed</h3>
        <div className="feed" data-testid="event-feed" style={{ maxHeight: 260 }}>
          {feed.length === 0 ? (
            <span className="muted small">No console output or page errors yet.</span>
          ) : (
            feed.map((e, i) => (
              <div
                key={i}
                className="mono small"
                style={{ color: e.kind === 'pageerror' ? 'var(--red)' : e.kind === 'console' ? 'var(--amber)' : 'var(--green)' }}
                data-kind={e.kind}
              >
                [{e.kind}] {e.text}
              </div>
            ))
          )}
        </div>
        <p className="small muted" style={{ marginTop: '0.5rem' }}>
          Uncaught exceptions (<code>pageerror</code>) are red — they never show in the console as errors you'd notice.
        </p>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'error-monitor',
  track: 'expert',
  title: 'Console & Page-Error Monitoring',
  summary: 'Assert that flows produce zero uncaught JS errors — and catch the ones that silently corrupt your app.',
  concepts: ['page.on("pageerror")', 'page.on("console")', 'auto fixtures', 'global error policy'],
  task: TASK,
  hints: [
    'pageerror fires for UNCAUGHT exceptions (an async throw, a broken event handler). console.error is just console output — a well-behaved app should have neither during a clean flow.',
    'Register listeners BEFORE goto: const errors: string[] = []; page.on("pageerror", (err) => errors.push(err.message));',
    'To make it a project-wide rule, build an auto fixture: test.extend({ noErrors: [async ({ page }, use) => { const e: string[] = []; page.on("pageerror", (err) => e.push(err)); await use(); expect(e).toEqual([]); }, { auto: true }] }) — every test then fails on uncaught errors automatically.',
    'The feed in the playground monkey-patches console so you can SEE the events; your tests should use the Playwright events, not the monkey-patch.',
  ],
  solution: `test('a clean flow produces zero page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/expert/error-monitor');
  await page.getByTestId('clean-action').click();
  await page.getByTestId('console-log').click(); // console.log is not an error

  await expect(page.getByTestId('event-feed')).toContainText('hello from the page console');
  expect(errors).toEqual([]);
});

test('uncaught exceptions are observable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/expert/error-monitor');
  await page.getByTestId('throw-error').click();
  await expect.poll(() => errors.some((m) => m.includes('Explosive'))).toBe(true);
});

// the golden pattern, as a reusable auto fixture:
const test = base.extend<{ noPageErrors: void }>({
  noPageErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await use();
    expect(errors, 'uncaught JS errors on the page').toEqual([]);
  }, { auto: true }],
});`,
  example: 'examples/expert/error-monitor.spec.ts',
  path: '/expert/error-monitor',
};
