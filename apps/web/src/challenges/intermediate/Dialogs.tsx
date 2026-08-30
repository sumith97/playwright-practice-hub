import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Native browser dialogs live outside the DOM — handle them with page.on("dialog"):

1. Click "Show alert" — an alert dialog appears. Handle it and assert your handler ran (the result region logs it).
2. Click "Ask confirmation" — accept it once, then dismiss it on a second run. The result region records both outcomes.
3. Click "Ask a question" — a prompt appears. Answer it with your favorite locator, then try dismissing it.
4. Toggle "Navigation guard", then click "Leave this page" — a beforeunload dialog appears (only when the guard is on).
5. The custom modal at the bottom is a normal DOM element — open, confirm and dismiss it like any other UI.`;

export default function Dialogs() {
  const [log, setLog] = useState<string[]>([]);
  const [guard, setGuard] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalResult, setModalResult] = useState('');
  const guardRef = useRef(false);

  useEffect(() => {
    guardRef.current = guard;
  }, [guard]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (guardRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const addLog = (entry: string) => setLog((prev) => [`${new Date().toLocaleTimeString()} — ${entry}`, ...prev].slice(0, 6));

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn" data-testid="alert-button" onClick={() => window.alert('Alert! Native dialogs are handled in test code.')}>
          Show alert
        </button>
        <button
          type="button"
          className="btn secondary"
          data-testid="confirm-button"
          onClick={() => addLog(window.confirm('Do you accept the terms?') ? 'confirmation accepted' : 'confirmation dismissed')}
        >
          Ask confirmation
        </button>
        <button
          type="button"
          className="btn secondary"
          data-testid="prompt-button"
          onClick={() => {
            const answer = window.prompt('What is your favorite locator?', 'getByRole');
            addLog(answer === null ? 'prompt dismissed' : `prompt answered: "${answer}"`);
          }}
        >
          Ask a question
        </button>
        <label className="small" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
          <input type="checkbox" data-testid="nav-guard" checked={guard} onChange={(e) => setGuard(e.target.checked)} /> Navigation guard
        </label>
        <a href="/" className="btn subtle" data-testid="leave-page">
          Leave this page
        </a>
      </div>

      <div className="status-region" data-testid="dialog-log" style={{ marginTop: '1rem', minHeight: '3rem' }}>
        {log.length === 0 ? 'Dialog results will be logged here.' : log.map((entry) => <div key={entry}>{entry}</div>)}
      </div>

      <hr style={{ margin: '1.2rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
      <button type="button" className="btn subtle" data-testid="open-modal" onClick={() => setModalOpen(true)}>
        Open custom modal
      </button>
      {modalResult && (
        <p className="small" data-testid="modal-result">
          {modalResult}
        </p>
      )}
      {modalOpen && (
        <div className="modal-overlay" data-testid="modal-overlay">
          <div className="modal" role="dialog" aria-modal="true" aria-label="Confirm deletion">
            <h3>Delete the internet?</h3>
            <p className="small muted">This cannot be undone (relax — it is a practice modal).</p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn danger"
                data-testid="modal-confirm"
                onClick={() => {
                  setModalResult('Modal: deletion confirmed');
                  setModalOpen(false);
                }}
              >
                Yes, delete
              </button>
              <button
                type="button"
                className="btn subtle"
                data-testid="modal-cancel"
                onClick={() => {
                  setModalResult('Modal: cancelled');
                  setModalOpen(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'dialogs',
  track: 'intermediate',
  title: 'Dialogs',
  summary: 'alert, confirm, prompt, beforeunload and a DOM-based custom modal — two different worlds of dialogs.',
  concepts: ['page.on("dialog")', 'dialog.accept() / dismiss()', 'beforeunload', 'custom modals'],
  task: TASK,
  hints: [
    'Register the handler BEFORE triggering: page.on("dialog", (dialog) => dialog.accept("getByRole")). Playwright auto-dismisses dialogs when no listener exists.',
    'Confirm: dialog.accept() vs dialog.dismiss(). The result region logs "confirmation accepted" / "dismissed".',
    'beforeunload dialogs need dialog.accept() too. The custom modal is ordinary DOM — assert and click it normally.',
  ],
  solution: `test('native and custom dialogs', async ({ page }) => {
  const messages: string[] = [];

  await page.goto('/intermediate/dialogs');

  // register each handler BEFORE triggering — one dialog, one handler,
  // otherwise two handlers race to accept/dismiss the same dialog.
  page.once('dialog', (d) => { messages.push(d.type()); d.accept(); });
  await page.getByTestId('alert-button').click();

  page.once('dialog', (d) => { messages.push(d.type()); d.accept(); });
  await page.getByTestId('confirm-button').click();
  await expect(page.getByTestId('dialog-log')).toContainText('confirmation accepted');

  page.once('dialog', (d) => { messages.push(d.type()); d.accept('getByRole'); });
  await page.getByTestId('prompt-button').click();
  await expect(page.getByTestId('dialog-log')).toContainText('prompt answered: "getByRole"');

  page.once('dialog', (d) => d.dismiss());
  await page.getByTestId('confirm-button').click();
  await expect(page.getByTestId('dialog-log')).toContainText('confirmation dismissed');

  expect(messages).toContain('alert');

  // custom modal — plain DOM
  await page.getByTestId('open-modal').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByTestId('modal-confirm').click();
  await expect(page.getByTestId('modal-result')).toHaveText('Modal: deletion confirmed');
});`,
  example: 'examples/intermediate/dialogs.spec.ts',
  path: '/intermediate/dialogs',
};
