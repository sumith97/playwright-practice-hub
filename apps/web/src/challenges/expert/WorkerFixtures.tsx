import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch } from '../../lib/api';

const TASK = `Graduate from test fixtures to WORKER fixtures — shared setup with per-process lifetime:

1. Build a custom test object with test.extend: a worker-scoped, auto fixture (bootstrap) that verifies the API is healthy once per worker, and a worker-scoped value fixture (ns) exposing a namespace UNIQUE to the current worker (test.info().workerIndex is your friend).
2. Write two tests that claim slots under \`\${ns}-a\` and \`\${ns}-b\` — both get 201; re-claiming the same slot gets 409.
3. Run with --workers=4 and observe: tests in the same worker share the namespace; different workers never collide because their namespaces differ. That is the blueprint for parallel-safe suites.
4. Notice the caveat in our implementation: CI runs whole files in parallel, so our auto fixture does a health check instead of wiping data — a real reset-once-per-worker is only safe when tests claim resources through unique namespaces like this one.`;

export default function WorkerFixtures() {
  const [name, setName] = useState('');
  const [claimed, setClaimed] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    try {
      const data = await apiFetch<{ reserved: string[] }>('/api/reservations');
      setClaimed(data.reserved.filter((r) => r.startsWith('ns-')));
    } catch {
      setMessage('practice API unreachable — npm run dev starts it');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const claim = async () => {
    const id = name.trim();
    if (!id) return;
    try {
      await apiFetch(`/api/reserve/ns-${id}`, { method: 'POST' });
      setMessage(`ns-${id} claimed (HTTP 201)`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'claim failed');
    }
    await refresh();
  };

  return (
    <div className="card">
      <h3>Namespace claim board</h3>
      <p className="small muted">
        Claims live under the <code>ns-</code> prefix — the same convention the reference test's <code>ns</code> fixture
        uses to keep workers collision-free.
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.7rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          data-testid="ns-input"
          aria-label="Namespace to claim"
          placeholder="e.g. marketing-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="button" className="btn" data-testid="ns-claim" onClick={claim}>
          Claim ns-&lt;name&gt;
        </button>
        <button type="button" className="btn subtle" data-testid="ns-refresh" onClick={refresh}>
          Refresh
        </button>
      </div>
      <p className="status-region" data-testid="ns-message">
        {message || 'Claim a namespace, or let the tests do it.'}
      </p>
      {claimed.length > 0 && (
        <ul data-testid="ns-list">
          {claimed.map((c) => (
            <li key={c}>
              <code>{c}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'worker-fixtures',
  track: 'expert',
  title: 'Worker-Scoped Fixtures',
  summary: 'Share expensive setup across tests in a worker while keeping data parallel-safe with worker-unique namespaces.',
  concepts: ['test.extend', 'scope: "worker"', 'auto fixtures', 'workerIndex', 'parallel-safe data'],
  task: TASK,
  hints: [
    'Fixture options are the array form: myFixture: [async (fixtures, use) => {...}, { scope: "worker", auto: true }]. Worker fixtures run once per worker PROCESS, not per test.',
    'Worker fixtures receive workerInfo as the third argument: async ({}, use, workerInfo) => use(`w${workerInfo.workerIndex}`). Test-scoped fixtures receive testInfo instead.',
    'Worker fixtures may only depend on OTHER WORKER fixtures (browser, or your own worker fixtures) — test-scoped ones like request and page are rejected at load time. Need an API call in a worker fixture? Use a throwaway browser.newContext().',
    'auto: true means tests do not have to request the fixture by name — their destructuring simply sees its values.',
    'Rule of thumb: worker-scoped for expensive READ-ONLY setup (seeding, health checks, spawning helpers); anything mutating shared state must flow through worker-unique names, or it will flake under --workers.',
  ],
  solution: `import { test as base, expect } from '@playwright/test';

const test = base.extend<{ bootstrap: void; ns: string }>({
  // auto + worker-scoped: once per worker, before any test in it
  bootstrap: [
    async ({ browser }, use) => {
      // worker fixtures may only depend on other WORKER fixtures — the
      // request and page fixtures are test-scoped and would be rejected.
      // Manual contexts do not inherit baseURL, hence the explicit origin.
      const context = await browser.newContext({ baseURL: 'http://localhost:5173' });
      const health = await context.request.get('/api/health');
      if (!health.ok()) throw new Error('practice API is not healthy');
      await context.close();
      await use();
    },
    { scope: 'worker', auto: true },
  ],
  // a value unique to this worker — the golden pattern for parallel-safe data
  ns: [
    async ({}, use, workerInfo) => {
      await use(\`ns-w\${workerInfo.workerIndex}-\${Date.now().toString(36)}\`);
    },
    { scope: 'worker' },
  ],
});

test('claims are parallel-safe via unique namespaces', async ({ request, ns }) => {
  const first = await request.post(\`/api/reserve/\${ns}-a\`);
  expect(first.status()).toBe(201);
  const second = await request.post(\`/api/reserve/\${ns}-a\`);
  expect(second.status()).toBe(409);
});

test('a sibling test in the same worker reuses the namespace', async ({ request, ns }) => {
  const res = await request.post(\`/api/reserve/\${ns}-b\`);
  expect(res.status()).toBe(201);
});`,
  example: 'examples/expert/worker-fixtures.spec.ts',
  path: '/expert/worker-fixtures',
};
