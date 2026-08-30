import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Time is the enemy of flaky tests — and page.clock puts it under your control:

1. The live clock ticks every second. Use page.clock.install() before navigation and page.clock.runFor('1m') to jump forward, asserting the displayed time moved accordingly.
2. The session countdown starts at 05:00 and hits zero with a red "Session expired" banner. Fast-forward 5 minutes without waiting 5 real minutes.
3. A "scheduled message" is due 5 seconds after page load — runFor('5s') makes it appear instantly.
4. All widgets rely on Date and setTimeout/setInterval, which is exactly what page.clock mocks.`;

const SESSION_SECONDS = 300;

export default function Clock() {
  const [now, setNow] = useState(() => new Date());
  const [remaining, setRemaining] = useState(SESSION_SECONDS);
  const [scheduled, setScheduled] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const clockId = window.setInterval(() => setNow(new Date()), 1000);
    const countdownId = window.setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    const scheduleId = window.setTimeout(() => setScheduled(true), 5000);
    return () => {
      window.clearInterval(clockId);
      window.clearInterval(countdownId);
      window.clearTimeout(scheduleId);
    };
  }, []);

  const format = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.current) / 1000));

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div className="card">
        <h3>Live clock</h3>
        <p style={{ fontSize: '1.6rem', fontFamily: 'var(--mono)', fontWeight: 800 }} data-testid="live-clock">
          {now.toLocaleTimeString()}
        </p>
        <p className="small muted">
          Elapsed on page: <span data-testid="elapsed">{format(elapsedSeconds)}</span>
        </p>
      </div>

      <div className="card">
        <h3>Session countdown</h3>
        {remaining > 0 ? (
          <>
            <p style={{ fontSize: '1.6rem', fontFamily: 'var(--mono)', fontWeight: 800 }} data-testid="countdown">
              {format(remaining)}
            </p>
            <p className="small muted">Session expires at zero.</p>
          </>
        ) : (
          <p className="status-region err" data-testid="session-expired" role="alert">
            Session expired — please log in again.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Scheduled message</h3>
        {scheduled ? (
          <p className="status-region ok" data-testid="scheduled-message">
            The scheduled message has arrived.
          </p>
        ) : (
          <p className="small muted" data-testid="scheduled-pending">
            Something is scheduled 5 seconds after page load…
          </p>
        )}
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'clock',
  track: 'advanced',
  title: 'Clock & Timers',
  summary: 'Mock browser time with page.clock: fast-forward countdowns, timers and schedules without waiting.',
  concepts: ['page.clock.install()', 'clock.runFor / fastForward', 'setTimeout & setInterval', 'time-dependent UI'],
  task: TASK,
  hints: [
    'Install the fake clock BEFORE the page loads: await page.clock.install(); await page.goto("/advanced/clock"); — then Date and timers are fully controlled.',
    'Jump forward: await page.clock.runFor("00:01:00") advances 60 real-scheduled seconds instantly. fastForward() skips timers without running intermediate ones.',
    'Pause if you need determinism: await page.clock.pauseAt(new Date("2026-01-01T10:00:00")) — then runFor to trigger exactly the timers you want.',
  ],
  solution: `import { test, expect } from '@playwright/test';

test('fast-forward time with page.clock', async ({ page }) => {
  await page.clock.install();
  await page.goto('/advanced/clock');

  // countdown races to zero without waiting 5 real minutes
  await page.clock.runFor('00:05:01');
  await expect(page.getByTestId('session-expired')).toBeVisible();

  // the scheduled message is due after 5s — we already passed that
  await expect(page.getByTestId('scheduled-message')).toBeVisible();
});

test('clock display advances', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00') });
  await page.goto('/advanced/clock');
  await expect(page.getByTestId('live-clock')).toHaveText(/10:00:00/);

  await page.clock.runFor('00:00:30');
  await expect(page.getByTestId('live-clock')).toHaveText(/10:00:30/);
});`,
  example: 'examples/advanced/clock.spec.ts',
  path: '/advanced/clock',
};
