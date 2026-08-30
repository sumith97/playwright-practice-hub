import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { useToast } from '../../lib/toast';

const TASK = `Transient UI disappears fast — that is exactly what makes it flaky to assert:

1. Click "Save changes" — a success toast appears bottom-right and auto-dismisses after ~3s. Assert it appears, then disappears.
2. Click "Fire 3 notifications" — three toasts stack up. Assert exactly 3 are visible at once.
3. Click "Persistent error" — an error toast stays for ~8s (much longer than the default assertion timeout — think about timeouts).
4. The active toast count is shown — assert against it directly.`;

export default function Toasts() {
  const { notify } = useToast();
  const [fired, setFired] = useState(0);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn"
          data-testid="save-button"
          onClick={() => {
            notify('Changes saved', 'success');
            setFired((f) => f + 1);
          }}
        >
          Save changes
        </button>
        <button
          type="button"
          className="btn secondary"
          data-testid="notify-button"
          onClick={() => {
            [0, 1, 2].forEach((i) => window.setTimeout(() => notify(`Notification ${i + 1} of 3`), i * 300));
            setFired((f) => f + 3);
          }}
        >
          Fire 3 notifications
        </button>
        <button
          type="button"
          className="btn danger"
          data-testid="error-button"
          onClick={() => {
            notify('Payment provider unreachable — retrying in the background', 'error', 8000);
            setFired((f) => f + 1);
          }}
        >
          Persistent error
        </button>
      </div>
      <p className="small muted" style={{ marginTop: '1rem' }} data-testid="fired-count">
        Toasts fired this session: {fired}
      </p>
      <p className="small muted">
        Watch the bottom-right corner. The toast region is <code>role="status"</code> with aria-live, so screen readers
        — and your tests — can catch transient messages.
      </p>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'toasts',
  track: 'intermediate',
  title: 'Toasts & Transient UI',
  summary: 'Assert toasts that appear, stack and auto-dismiss — before they vanish on you.',
  concepts: ['toBeVisible with timeout', 'toBeHidden', 'aria-live regions', 'stacked elements'],
  task: TASK,
  hints: [
    'The region is page.getByTestId("toast-region"); individual toasts are page.getByTestId("toast") — matching several, hence .first() / .nth() or filtering by text.',
    'Appearance is easy: expect(page.getByTestId("toast")).toContainText("Changes saved"). Disappearance: expect(...).toBeHidden({ timeout: 5000 }) — the toast removes itself after 3s.',
    'Count stacked toasts: expect(page.getByTestId("toast")).toHaveCount(3).',
  ],
  solution: `test('catch them before they vanish', async ({ page }) => {
  await page.goto('/intermediate/toasts');

  // single toast lifecycle
  await page.getByTestId('save-button').click();
  const toast = page.getByTestId('toast').filter({ hasText: 'Changes saved' });
  await expect(toast).toBeVisible();
  await expect(toast).toBeHidden({ timeout: 5000 });

  // stacked toasts
  await page.getByTestId('notify-button').click();
  await expect(page.getByTestId('toast')).toHaveCount(3);

  // long-lived error toast
  await page.getByTestId('error-button').click();
  await expect(page.getByTestId('toast').filter({ hasText: 'Payment provider' }))
    .toBeVisible({ timeout: 1000 });

  await expect(page.getByTestId('fired-count')).toHaveText('Toasts fired this session: 5');
});`,
  example: 'examples/intermediate/toasts.spec.ts',
  path: '/intermediate/toasts',
};
