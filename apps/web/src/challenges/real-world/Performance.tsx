import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `"Is the page still fast?" — make performance an assertion, not a vibe:

1. The metrics panel shows LIVE browser numbers: navigation duration, DOMContentLoaded, First Contentful Paint, resource entry count and transfer size (all from the Performance API the page itself uses).
2. Read the same numbers from your test with page.evaluate(() => performance.getEntriesByType(...)) and assert budget-friendly bounds.
3. Click "Load 12 assets" — the app fetches 12 no-store SVGs. Assert the resource entry count grows by exactly 12 and the transfer total rises.
4. On Chromium, also read engine counters (Nodes, JSHeapUsedSize) through a CDP session — Performance.getMetrics — and learn why that API is engine-specific. (Note: page.metrics() does NOT exist in Playwright — that is Puppeteer's API.)`;

interface Metrics {
  duration: number | null;
  dcl: number | null;
  fcp: number | null;
  resources: number;
  transferKb: number;
}

function readMetrics(): Metrics {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const fcp = performance
    .getEntriesByType('paint')
    .find((p) => p.name === 'first-contentful-paint');
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const transfer = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  return {
    duration: nav ? Math.round(nav.duration) : null,
    dcl: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
    fcp: fcp ? Math.round(fcp.startTime) : null,
    resources: resources.length,
    transferKb: Math.round(transfer / 1024),
  };
}

export default function Performance() {
  const [metrics, setMetrics] = useState<Metrics>({ duration: null, dcl: null, fcp: null, resources: 0, transferKb: 0 });
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    setMetrics(readMetrics());
  }, []);

  const loadAssets = async () => {
    const batch = Array.from({ length: 12 }, (_, i) => fetch(`/api/perf/asset?i=${i + 1}`).then((r) => r.blob()));
    await Promise.all(batch);
    setLoaded(12);
    setMetrics(readMetrics());
  };

  return (
    <div>
      <div className="card">
        <h3>Live page metrics</h3>
        <table className="data" data-testid="perf-table">
          <tbody>
            <tr>
              <td>Navigation duration</td>
              <td className="price" data-testid="perf-duration">
                {metrics.duration === null ? '—' : `${metrics.duration} ms`}
              </td>
            </tr>
            <tr>
              <td>DOM content loaded</td>
              <td className="price" data-testid="perf-dcl">
                {metrics.dcl === null ? '—' : `${metrics.dcl} ms`}
              </td>
            </tr>
            <tr>
              <td>First contentful paint</td>
              <td className="price" data-testid="perf-fcp">
                {metrics.fcp === null ? 'n/a' : `${metrics.fcp} ms`}
              </td>
            </tr>
            <tr>
              <td>Resource entries</td>
              <td className="price" data-testid="perf-resources">
                {metrics.resources}
              </td>
            </tr>
            <tr>
              <td>Transfer size</td>
              <td className="price" data-testid="perf-transfer">
                {metrics.transferKb} KB
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', alignItems: 'center' }}>
          <button type="button" className="btn" data-testid="perf-load-assets" onClick={loadAssets}>
            Load 12 assets
          </button>
          <button
            type="button"
            className="btn subtle"
            data-testid="perf-refresh"
            onClick={() => setMetrics(readMetrics())}
          >
            Refresh metrics
          </button>
          <span className="small muted" data-testid="perf-assets">
            Assets loaded this session: {loaded}
          </span>
        </div>
      </div>
      <p className="small muted" style={{ marginTop: '0.8rem' }}>
        Budgets in tests must be generous — CI machines are slower than yours. Assert order of magnitude, not milliseconds.
      </p>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'performance-smoke',
  track: 'real-world',
  title: 'Performance Smoke Testing',
  summary: 'Turn browser timings into assertions: navigation budgets, resource counts, transfer size, and page.metrics().',
  concepts: ['Performance API via evaluate', 'performance budgets', 'page.metrics()', 'resource entries'],
  task: TASK,
  hints: [
    'Read timings from inside the browser: await page.evaluate(() => performance.getEntriesByType("navigation")[0].duration) — the same numbers the panel shows.',
    'Resource entries only include requests the page made AFTER navigation started (fetch/XHR, scripts, CSS). transferSize is 0 for cached or cross-origin no-TAO responses — count entries, not bytes, when in doubt.',
    'Engine counters come from the Chrome DevTools Protocol: const client = await page.context().newCDPSession(page); await client.send("Performance.enable"); const { metrics } = await client.send("Performance.getMetrics"); — the domain must be enabled before getMetrics returns anything. Chromium-only, so skip explicitly elsewhere. (Playwright has no page.metrics(); that method belongs to Puppeteer.)',
    'Budget style: assert duration < 15000 rather than < 1000. A perf smoke test catches "page got 10x slower", not "CI laptop is warm".',
  ],
  solution: `test('the page loads within budget', async ({ page }) => {
  await page.goto('/real-world/performance-smoke');

  const duration = await page.evaluate(() => performance.getEntriesByType('navigation')[0].duration);
  expect(duration).toBeLessThan(15_000);
  await expect(page.getByTestId('perf-duration')).toContainText(/ms/);
});

test('loading assets is visible in the resource timeline', async ({ page }) => {
  await page.goto('/real-world/performance-smoke');

  const before = await page.evaluate(() => performance.getEntriesByType('resource').length);
  await page.getByTestId('perf-load-assets').click();

  await expect(page.getByTestId('perf-assets')).toHaveText('Assets loaded this session: 12');
  await expect
    .poll(async () => page.getByTestId('perf-resources').textContent())
    .toBe(String(before + 12));
});

test('engine counters on Chromium', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'CDP Performance.getMetrics is Chromium-only');
  testInfo.annotations.push({ type: 'engine', description: browserName });

  await page.goto('/real-world/performance-smoke');
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  const { metrics } = await client.send('Performance.getMetrics');
  const byName: Record<string, number> = {};
  for (const m of metrics) byName[m.name] = m.value;
  expect(byName.Nodes).toBeGreaterThan(0);
  expect(byName.JSHeapUsedSize).toBeGreaterThan(0);
});`,
  example: 'examples/real-world/performance-smoke.spec.ts',
  path: '/real-world/performance-smoke',
};
