import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Frames are separate documents — practice frameLocator:

1. Click "Load frame" — the iframe only mounts after ~1.2s (auto-waiting applies to frames too).
2. Inside the iframe, type your name and click "Greet parent". The greeting should appear OUTSIDE the frame, in the status region below.
3. Inside the nested (second-level) frame, type a value and click "Save deep value" — assert the confirmation inside that nested frame itself.`;

export default function Iframes() {
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; text?: string };
      if (data?.type === 'iframe-greeting' && data.text) setGreeting(data.text);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const loadFrame = () => {
    setLoading(true);
    timer.current = window.setTimeout(() => {
      setFrameSrc('/frames/inner.html');
      setLoading(false);
    }, 1200);
  };

  return (
    <div>
      <button type="button" className="btn" data-testid="load-frame" onClick={loadFrame} disabled={loading || frameSrc !== null}>
        Load frame
      </button>
      {loading && (
        <p style={{ marginTop: '0.6rem' }}>
          <span className="spinner" aria-label="Loading frame" data-testid="frame-spinner" />
        </p>
      )}
      {frameSrc && (
        <iframe
          className="frame-demo"
          data-testid="demo-frame"
          title="Demo iframe"
          src={frameSrc}
          style={{ marginTop: '1rem', height: 300 }}
        />
      )}
      <p className="status-region" data-testid="greeting-region">
        {greeting || 'The parent page will show the iframe greeting here.'}
      </p>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'iframes',
  track: 'intermediate',
  title: 'iFrames',
  summary: 'Late-loading iframes, interacting across document boundaries, and a nested second-level frame.',
  concepts: ['frameLocator', 'nested frames', 'auto-wait for frames', 'postMessage'],
  task: TASK,
  hints: [
    'Locate inside frames with frameLocator: page.getByTestId("demo-frame").contentFrame().getByLabel("Your name") — or page.frameLocator("[data-testid=demo-frame]").',
    'The nested frame lives INSIDE the inner frame: frameLocator("#demo-frame").frameLocator("#deep-frame") — frameLocators compose.',
    'The iframe mounts 1.2s after clicking "Load frame" — your first locator action will simply wait for the frame to exist. No manual waiting required.',
  ],
  solution: `test('across frame boundaries', async ({ page }) => {
  await page.goto('/intermediate/iframes');
  await page.getByTestId('load-frame').click();

  const frame = page.getByTestId('demo-frame').contentFrame();

  await frame.getByLabel('Your name').fill('Ada');
  await frame.getByRole('button', { name: 'Greet parent' }).click();
  await expect(page.getByTestId('greeting-region')).toHaveText('Hello Ada, from the inner frame!');

  // nested frame inside the inner frame
  const deep = frame.locator('#deep-frame').contentFrame();
  await deep.getByPlaceholder('deep-secret').fill('nested-value');
  await deep.getByRole('button', { name: 'Save deep value' }).click();
  await expect(deep.locator('#deep-status')).toHaveText('Deep frame saved: "nested-value"');
});`,
  example: 'examples/intermediate/iframes.spec.ts',
  path: '/intermediate/iframes',
};
