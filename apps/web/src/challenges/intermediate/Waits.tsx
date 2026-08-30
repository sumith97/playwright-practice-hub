import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { chaosDelay, useChaos } from '../../lib/chaos';

const TASK = `This page is full of timing traps — and Playwright's auto-waiting is the answer:

1. Click "Load content" — a spinner shows for ~2s before the content block appears. Assert the result WITHOUT a fixed sleep.
2. Click "Start progress" — the bar animates from 0% to 100%. Assert it reaches "100%".
3. Click "Flash message" — the message appears for ~2.5s and then disappears. Assert it becomes visible, then hidden.
4. A "slow badge" appears on its own ~3s after the page loads — assert it eventually shows.
5. The counter at the bottom increments to 10 over ~5 seconds. Write a polling assertion that waits for it to reach 10 (expect.poll).`;

export default function Waits() {
  const { enabled: chaos } = useChaos();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [flash, setFlash] = useState(false);
  const [slowBadge, setSlowBadge] = useState(false);
  const [counter, setCounter] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => setSlowBadge(true), 3000);
    timers.current.push(id);
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const loadContent = async () => {
    setLoading(true);
    await chaosDelay(chaos, 2000);
    setLoading(false);
    setLoaded(true);
  };

  const startProgress = () => {
    setProgress(0);
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(id);
          return 100;
        }
        return Math.min(100, p + 5);
      });
    }, 200);
    timers.current.push(id);
  };

  const startCounter = () => {
    const id = window.setInterval(() => {
      setCounter((c) => {
        if (c >= 10) {
          window.clearInterval(id);
          return 10;
        }
        return c + 1;
      });
    }, 500);
    timers.current.push(id);
  };

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div className="card">
        <h3>Spinner then content</h3>
        <button type="button" className="btn" data-testid="load-content" onClick={loadContent} disabled={loading}>
          Load content
        </button>
        {loading && (
          <p style={{ marginTop: '0.7rem' }}>
            <span className="spinner" data-testid="content-spinner" aria-label="Loading" />
          </p>
        )}
        {loaded && (
          <p data-testid="loaded-content" className="fade-in" style={{ marginTop: '0.7rem' }}>
            Content arrived after {chaos ? 'a chaotic' : 'a 2 second'} wait.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Progress bar</h3>
        <button type="button" className="btn subtle" data-testid="start-progress" onClick={startProgress}>
          Start progress
        </button>
        <div
          className="progressbar-outer"
          style={{ marginTop: '0.8rem' }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          data-testid="progress-track"
        >
          <div className="progressbar-inner" style={{ width: `${progress}%` }} />
        </div>
        <p data-testid="progress-label">{progress}%</p>
      </div>

      <div className="card">
        <h3>Transient message</h3>
        <button
          type="button"
          className="btn subtle"
          data-testid="flash-button"
          onClick={() => {
            setFlash(true);
            window.setTimeout(() => setFlash(false), 2500);
          }}
        >
          Flash message
        </button>
        {flash && (
          <p data-testid="flash-message" className="status-region ok" style={{ marginTop: '0.7rem' }}>
            I will vanish soon — assert my disappearance!
          </p>
        )}
      </div>

      <div className="card">
        <h3>Auto-appearing element</h3>
        {slowBadge ? (
          <p className="badge basic" data-testid="slow-badge" style={{ fontSize: '0.95rem' }}>
            Slow badge has landed
          </p>
        ) : (
          <p className="small muted">Nothing here yet… keep waiting.</p>
        )}
      </div>

      <div className="card">
        <h3>Counting to ten</h3>
        <button type="button" className="btn subtle" data-testid="start-counter" onClick={startCounter}>
          Start counter
        </button>
        <p style={{ fontSize: '1.6rem', fontWeight: 800 }} data-testid="slow-counter">
          {counter}
        </p>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'waits',
  track: 'intermediate',
  title: 'Waits & Auto-waiting',
  summary: 'Spinners, progress bars, transient messages and slow counters — learn to wait without page.waitForTimeout.',
  concepts: ['auto-waiting', 'expect with timeout', 'expect.poll', 'waitFor', 'never waitForTimeout'],
  task: TASK,
  hints: [
    'Playwright actions and assertions auto-retry. expect(page.getByTestId("loaded-content")).toBeVisible() waits up to 5s by default — no sleep needed. Set expect.configure or per-assert timeouts for longer waits.',
    'For value polling that is not DOM-state based, use expect.poll(() => page.getByTestId("slow-counter").textContent()) with expect.poll(...).toBe("10") or toHaveText which retries by itself.',
    'The transient flash needs TWO assertions: toBeVisible() right after the click, then toBeHidden({ timeout: 5000 }) to wait for the disappearance.',
  ],
  solution: `test('wait like a pro', async ({ page }) => {
  await page.goto('/intermediate/waits');

  await page.getByTestId('load-content').click();
  await expect(page.getByTestId('loaded-content')).toBeVisible({ timeout: 10_000 });

  await page.getByTestId('start-progress').click();
  await expect(page.getByTestId('progress-label')).toHaveText('100%', { timeout: 10_000 });

  await page.getByTestId('flash-button').click();
  const flash = page.getByTestId('flash-message');
  await expect(flash).toBeVisible();
  await expect(flash).toBeHidden({ timeout: 5000 });

  await expect(page.getByTestId('slow-badge')).toBeVisible({ timeout: 10_000 });

  await page.getByTestId('start-counter').click();
  await expect.poll(
    async () => page.getByTestId('slow-counter').textContent(),
    { timeout: 10_000 },
  ).toBe('10');
});`,
  example: 'examples/intermediate/waits.spec.ts',
  path: '/intermediate/waits',
};
