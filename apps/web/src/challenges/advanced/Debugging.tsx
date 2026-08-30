import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch } from '../../lib/api';

const TASK = `Debugging is a skill — practice the tools, not the guessing:

1. Click "Run flaky operation" — it calls the failing-then-succeeding API. Run your test with --trace on, open trace.playwright.dev, and inspect the failing steps, network and console.
2. The "late widget" appears after ~2.5s — practice debugging why a naive test fails.
3. Scroll the long list below and take a full-page screenshot — verify it captures everything.
4. Configure debugging artifacts in playwright.config.ts: trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' — then break a test on purpose and explore the report.
5. Try soft assertions (expect.soft) or the --debug inspector on this page.`;

export default function Debugging() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lateWidget, setLateWidget] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setLateWidget(true), 2500);
    return () => window.clearTimeout(id);
  }, []);

  const runFlaky = async () => {
    setStatus('loading');
    setAttempts((a) => a + 1);
    try {
      const data = await apiFetch<{ attempts: number }>('/api/flaky');
      setResult(`Flaky operation succeeded (attempt ${data.attempts}).`);
      setStatus('success');
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Request failed');
      setStatus('error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn" data-testid="run-flaky" onClick={runFlaky}>
          Run flaky operation
        </button>
        {lateWidget ? (
          <span className="badge basic" data-testid="late-widget" style={{ fontSize: '0.9rem' }}>
            Late widget arrived
          </span>
        ) : (
          <span className="small muted">Late widget loading…</span>
        )}
      </div>
      <p className="status-region" data-testid="flaky-result">
        {status === 'loading' ? <span className="spinner" aria-label="Running" /> : result || 'Result appears here. (POST /api/reset clears the failure counter.)'}
      </p>
      <p className="small muted" data-testid="attempt-count">
        Clicks this session: {attempts}
      </p>

      <h3 style={{ marginTop: '1.4rem' }}>Long list (for screenshot & scrolling practice)</h3>
      <ol data-testid="long-list" style={{ columns: 3, gap: '2rem' }}>
        {Array.from({ length: 30 }, (_, i) => (
          <li key={i}>Log entry #{i + 1} — {['INFO', 'WARN', 'DEBUG'][i % 3]} sample line for inspection</li>
        ))}
      </ol>

      <div className="panel" style={{ marginTop: '1.4rem' }}>
        <h3>Debugging playbook</h3>
        <pre>
          <code>{`# record a trace for every test
npx playwright test --trace on

# inspect it (interactive viewer: actions, DOM, network, console)
npx playwright show-trace test-results/.../trace.zip

# step through with the inspector
npx playwright test --debug

# generate baselines for visual tests
npx playwright test --update-snapshots`}</code>
        </pre>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'debugging',
  track: 'advanced',
  title: 'Debugging, Tracing & CI',
  summary: 'Trace viewer, inspector, soft assertions and failure artifacts — plus a CI-ready workflow with sharding.',
  concepts: ['trace viewer', '--debug inspector', 'soft assertions', 'failure artifacts', 'CI configuration'],
  task: TASK,
  hints: [
    'Traces: set trace: "retain-on-failure" in use; after a failure, open the trace zip with npx playwright show-trace — every action, DOM snapshot and network call is recorded.',
    'The flaky endpoint fails twice then succeeds: POST /api/reset in beforeEach to make runs deterministic, or practice test.describe.configure({ retries: 2 }).',
    'In CI, ship artifacts: the repo has .github/workflows/ci.yml with sharding (--shard) and report upload — copy it for your own projects.',
  ],
  solution: `import { test, expect } from '@playwright/test';

test('deterministic flaky operation with retry', async ({ page, request }) => {
  await request.post('/api/reset');
  await page.goto('/advanced/debugging');

  // version A: retry in the test with expect.poll on the UI state
  await page.getByTestId('run-flaky').click();
  await expect
    .poll(async () => page.getByTestId('flaky-result').textContent(), { timeout: 15_000 })
    .toContain('succeeded');
});

test('late widget auto-waits', async ({ page }) => {
  await page.goto('/advanced/debugging');
  await expect(page.getByTestId('late-widget')).toBeVisible({ timeout: 5000 });
});

test('full-page screenshot of the long list', async ({ page }) => {
  await page.goto('/advanced/debugging');
  await page.getByTestId('long-list').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'debugging-page.png', fullPage: true });
  await expect(page.getByTestId('long-list').locator('li')).toHaveCount(30);
});`,
  example: 'examples/advanced/debugging.spec.ts',
  path: '/advanced/debugging',
};
