import { test as base, expect } from '@playwright/test';

/**
 * The blueprint for parallel-safe suites: an auto worker-scoped fixture for
 * expensive per-worker setup, and a worker-unique namespace value that keeps
 * mutating tests collision-free under --workers.
 *
 * Note: our auto fixture deliberately does NOT wipe shared API state — CI runs
 * whole spec files in parallel, so a reset here would sabotage sibling files.
 * It validates API health once per worker instead, which is the safe subset of
 * the pattern; the namespace fixture demonstrates the collision-free part.
 */
const test = base.extend<{ bootstrap: void; ns: string }>({
  bootstrap: [
    async ({ browser }, use) => {
      // worker fixtures may only depend on other WORKER fixtures (browser is
      // one) — test-scoped ones like `request`/`page` are off-limits here.
      // Manual contexts don't inherit baseURL, hence the explicit origin.
      const context = await browser.newContext({ baseURL: 'http://localhost:5173' });
      const health = await context.request.get('/api/health');
      if (!health.ok()) throw new Error('practice API is not healthy');
      await context.close();
      await use();
    },
    { scope: 'worker', auto: true },
  ],
  ns: [
    async ({}, use, workerInfo) => {
      await use(`ns-w${workerInfo.workerIndex}-${Date.now().toString(36)}`);
    },
    { scope: 'worker' },
  ],
});

test.describe('Expert · Worker-Scoped Fixtures', () => {
  // fullyParallel puts every test in its own worker; serial mode keeps these
  // two tests in ONE worker — which is the whole point of the demonstration
  test.describe.configure({ mode: 'serial' });

  test('claims are parallel-safe via worker-unique namespaces', async ({ request, ns }) => {
    const first = await request.post(`/api/reserve/${ns}-a`);
    expect(first.status()).toBe(201);
    expect(await first.json()).toMatchObject({ id: `${ns}-a`, status: 'reserved' });

    const second = await request.post(`/api/reserve/${ns}-a`);
    expect(second.status()).toBe(409);
    expect((await second.json()).error).toContain('already reserved');
  });

  test('a sibling test in the same worker shares the namespace', async ({ request, ns }) => {
    const res = await request.post(`/api/reserve/${ns}-b`);
    expect(res.status()).toBe(201);

    const list = await request.get('/api/reservations');
    expect((await list.json()).reserved).toContain(`${ns}-a`);
    expect((await list.json()).reserved).toContain(`${ns}-b`);
  });
});
