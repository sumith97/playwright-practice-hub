import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Visual regression needs discipline around dynamic content:

1. Take a screenshot of the "stable card" and assert it with expect(page.getByTestId("stable-card")).toHaveScreenshot() — run twice to create, then verify, the baseline.
2. The "live card" contains a spinning element and a per-second clock. Screenshot it with a MASK over the dynamic region, or the comparison never passes.
3. Take a full-page screenshot of the whole gallery (fullPage: true).
4. Learn the config knobs: maxDiffPixelRatio, threshold, and how CI fails on missing baselines.`;

export default function Visual() {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div className="card" data-testid="stable-card">
        <h3>Stable card</h3>
        <div style={{ fontSize: '2.4rem', textAlign: 'center' }} aria-hidden="true">
          🎭
        </div>
        <p>
          <strong>Playwright Theater</strong>
        </p>
        <p className="small muted">Deterministic content, fixed layout, no animations. Your baseline friend.</p>
        <button type="button" className="btn subtle" style={{ pointerEvents: 'none' }}>
          Static button
        </button>
      </div>

      <div className="card" data-testid="live-card">
        <h3>Live card</h3>
        <div
          data-testid="animated-region"
          className="pulse"
          style={{ fontSize: '2rem', textAlign: 'center' }}
          aria-hidden="true"
        >
          🔄
        </div>
        <p>
          Clock: <span data-testid="live-clock">{clock}</span>
        </p>
        <p className="small muted">
          The spinner and clock change every second — mask <code>[data-testid="animated-region"]</code> and{' '}
          <code>[data-testid="live-clock"]</code> or exclude them.
        </p>
      </div>

      <div className="card" data-testid="chart-card">
        <h3>Chart card</h3>
        <svg viewBox="0 0 200 100" width="100%" height={120} role="img" aria-label="Static bar chart">
          {[40, 70, 55, 90, 65].map((h, i) => (
            <rect key={i} x={10 + i * 38} y={100 - h} width={26} height={h} fill={i % 2 ? '#7c3aed' : '#4f46e5'} rx={3} />
          ))}
        </svg>
        <p className="small muted">An inline SVG — screenshots include it pixel-perfectly.</p>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'visual',
  track: 'advanced',
  title: 'Visual Testing',
  summary: 'Baseline screenshots, masking dynamic regions, and full-page comparisons.',
  concepts: ['toHaveScreenshot', 'masking', 'fullPage screenshots', 'baselines', 'maxDiffPixels'],
  task: TASK,
  hints: [
    'Run with --update-snapshots (or -u) the first time to write baselines into examples/advanced/visual.spec.ts-snapshots/. The second run compares.',
    'Masking: await expect(page.getByTestId("live-card")).toHaveScreenshot({ mask: [page.getByTestId("animated-region"), page.getByTestId("live-clock")] });',
    'Full page: await page.screenshot({ path: "gallery.png", fullPage: true }) — or assert toHaveScreenshot({ fullPage: true }). Screenshots of elements ignore position on the page, which keeps them stable.',
  ],
  solution: `import { test, expect } from '@playwright/test';

test('stable card matches its baseline', async ({ page }) => {
  await page.goto('/advanced/visual');
  await expect(page.getByTestId('stable-card')).toHaveScreenshot({
    maxDiffPixelRatio: 0.02,
  });
});

test('live card with masked dynamic regions', async ({ page }) => {
  await page.goto('/advanced/visual');
  await expect(page.getByTestId('live-card')).toHaveScreenshot({
    mask: [page.getByTestId('animated-region'), page.getByTestId('live-clock')],
    maxDiffPixelRatio: 0.02,
  });
});

test('full page gallery', async ({ page }) => {
  await page.goto('/advanced/visual');
  await expect(page).toHaveScreenshot({ fullPage: true, maxDiffPixelRatio: 0.05 });
});`,
  example: 'examples/advanced/visual.spec.ts',
  path: '/advanced/visual',
};
