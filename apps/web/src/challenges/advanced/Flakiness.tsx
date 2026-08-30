import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Welcome to the flakiness clinic — these widgets misbehave ON PURPOSE:

1. The "phantom card" re-mounts every ~2 seconds (its DOM nodes are replaced). Write an assertion that survives it — and understand why test.pause + eyeballing fails here.
2. Click "Unstable save" a few times: it flips between "Saving…" and "Saved!" with random timing. Assert the final state robustly.
3. Enable "Stabilize" to stop the remounting — handy while debugging, but the challenge is to pass WITHOUT it.
4. Review the hints on retries and test isolation — then check out the Chaos Mode toggle in the header to make EVERY page harder.`;

export default function Flakiness() {
  const [stabilize, setStabilize] = useState(false);
  const [generation, setGeneration] = useState(0);

  // The phantom card ALWAYS remounts here (that is the exercise) unless stabilized.
  useEffect(() => {
    if (stabilize) return;
    const id = window.setInterval(() => setGeneration((g) => g + 1), 2000);
    return () => window.clearInterval(id);
  }, [stabilize]);
  const remountKey = generation;

  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const unstableSave = () => {
    setSaving('saving');
    const delay = 300 + Math.random() * 900;
    timers.current.push(window.setTimeout(() => setSaving('saved'), delay));
  };

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
      <div className="card">
        <h3>Controls</h3>
        <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
          <input type="checkbox" data-testid="stabilize" checked={stabilize} onChange={(e) => setStabilize(e.target.checked)} /> Stabilize (stop remounting)
        </label>
        <p className="small muted" data-testid="generation" style={{ marginTop: '0.5rem' }}>
          Phantom card generation: {remountKey + 1}
        </p>
      </div>

      <div className="card" key={remountKey} data-testid="phantom-card">
        <h3>Phantom card</h3>
        <p>
          I re-mount every 2 seconds. My node identity is brand new:
        </p>
        <p className="small mono" data-testid="phantom-stamp">
          generation-{remountKey + 1} · mounted at {new Date().toLocaleTimeString()}
        </p>
        <button type="button" className="btn subtle" style={{ pointerEvents: 'none' }}>
          Also new every time
        </button>
      </div>

      <div className="card">
        <h3>Unstable save</h3>
        <button type="button" className="btn" data-testid="unstable-save" onClick={unstableSave} disabled={saving === 'saving'}>
          Unstable save
        </button>
        <p className="status-region" data-testid="save-state">
          {saving === 'idle' && 'Idle.'}
          {saving === 'saving' && 'Saving…'}
          {saving === 'saved' && 'Saved! ✓'}
        </p>
      </div>

      <div className="card">
        <h3>Clinical advice</h3>
        <ul className="small muted" style={{ paddingLeft: '1.2rem' }}>
          <li>Never assert on element identity — assert on text/role/state.</li>
          <li>Web-first assertions retry; use timeouts deliberately.</li>
          <li>Isolate state: <code>POST /api/reset</code> + fresh context per test.</li>
          <li>Retries mask, not fix — use them in CI, not as a strategy.</li>
        </ul>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'flakiness',
  track: 'advanced',
  title: 'Flakiness Clinic',
  summary: 'Remounting cards and randomly-timed saves — train yourself to write tests that survive real-world chaos.',
  concepts: ['detached DOM nodes', 'auto-waiting under re-renders', 'retries & isolation', 'chaos engineering'],
  task: TASK,
  hints: [
    'Remounting is invisible to good locators: expect(page.getByTestId("phantom-stamp")).toContainText(/generation-\\d+/) re-resolves against whatever node exists now.',
    'The save button disables while "Saving…" — wait for the FINAL state: expect(page.getByTestId("save-state")).toHaveText("Saved! ✓", { timeout: 5000 }).',
    'The generation counter text changes every remount — expect.poll on it to be greater than 1 proves the remount happened mid-test without failing.',
  ],
  solution: `test('survive remounting nodes', async ({ page }) => {
  await page.goto('/advanced/flakiness');

  // the stamp re-renders with a new generation on every remount
  await expect(page.getByTestId('phantom-stamp')).toContainText(/generation-\\d+/);

  // prove remounts happened while the test was running
  await expect
    .poll(async () => Number((await page.getByTestId('generation').textContent())!.match(/\\d+/)![0]), {
      timeout: 8000,
    })
    .toBeGreaterThan(1);
});

test('unstable save reaches the final state', async ({ page }) => {
  await page.goto('/advanced/flakiness');
  await page.getByTestId('unstable-save').click();

  const state = page.getByTestId('save-state');
  await expect(state).toHaveText('Saved! ✓', { timeout: 5000 });
  await expect(page.getByTestId('unstable-save')).toBeEnabled();
});`,
  example: 'examples/advanced/flakiness.spec.ts',
  path: '/advanced/flakiness',
};
