import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `axe-core checks attributes; HUMANS (and real a11y audits) navigate by keyboard. Practice:

1. The playground below is a self-contained mini-app. Focus its shell (data-testid="kb-app" — a tabIndex=-1 container, the standard way to focus a region), then press Tab: the skip link ("Skip to content") is the FIRST tab stop, before the mini-app's own nav.
2. The section tablist implements roving focus: focus a tab, then use ArrowRight / ArrowLeft — focus AND selection move together (aria-selected follows).
3. Open the shipping dialog: focus must move INTO the dialog (first field). Press Tab repeatedly — focus never escapes the modal (focus trap). Escape closes it and returns focus to the opener button.
4. Assert all of it with toBeFocused() and keyboard.press — zero mouse involved.`;

const TABS = ['Overview', 'Shipping', 'Billing'];

export default function KeyboardNav() {
  const [selected, setSelected] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogResult, setDialogResult] = useState('');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const onTablistKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? (index + 1) % TABS.length : (index - 1 + TABS.length) % TABS.length;
    setSelected(next);
    tabRefs.current[next]?.focus();
  };

  // focus trap inside the dialog + Escape handling
  useEffect(() => {
    if (!dialogOpen) return;
    const node = dialogRef.current;
    if (!node) return;

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>('button, input, select, textarea, [href]')).filter(
        (el) => !el.hasAttribute('disabled'),
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDialogResult('Dialog cancelled');
        setDialogOpen(false);
        openerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [dialogOpen]);

  return (
    <div data-testid="kb-app" tabIndex={-1} style={{ outline: 'none' }}>
      {/* a mini standalone page: skip link FIRST in its DOM, before its own header */}
      <a className="skip-link" href="#kb-main" data-testid="kb-skip-link">
        Skip to content
      </a>

      <nav aria-label="Mini app menu" style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
        <a href="#kb-main" onClick={(e) => e.preventDefault()}>Mini-app home</a>
        <a href="#kb-main" onClick={(e) => e.preventDefault()}>Mini-app docs</a>
      </nav>

      <div id="kb-main" className="card" tabIndex={-1}>
        <h3>Account settings</h3>

        <div role="tablist" aria-label="Sections" data-testid="kb-tabs" style={{ display: 'flex', gap: '0.4rem', margin: '0.6rem 0 1rem' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={selected === i}
              tabIndex={selected === i ? 0 : -1}
              onKeyDown={(e) => onTablistKey(e, i)}
              data-testid={`kb-tab-${tab.toLowerCase()}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <p className="status-region" data-testid="kb-panel">
          {TABS[selected]} panel
        </p>

        <button
          type="button"
          className="btn"
          ref={openerRef}
          data-testid="kb-open-dialog"
          onClick={() => setDialogOpen(true)}
          style={{ marginTop: '1rem' }}
        >
          Open shipping dialog
        </button>
        {dialogResult && (
          <p className="small" data-testid="kb-dialog-result">
            {dialogResult}
          </p>
        )}
      </div>

      {dialogOpen && (
        <div className="modal-overlay">
          <div
            className="modal"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shipping details"
            data-testid="kb-dialog"
          >
            <h3>Shipping details</h3>
            <div className="field">
              <label htmlFor="kb-street">Street address</label>
              <input id="kb-street" type="text" data-testid="kb-street" />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn"
                data-testid="kb-dialog-confirm"
                onClick={() => {
                  setDialogResult('Shipping details saved');
                  setDialogOpen(false);
                  openerRef.current?.focus();
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="btn subtle"
                data-testid="kb-dialog-cancel"
                onClick={() => {
                  setDialogResult('Dialog cancelled');
                  setDialogOpen(false);
                  openerRef.current?.focus();
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
  id: 'keyboard-nav',
  track: 'real-world',
  title: 'Keyboard Navigation & Focus',
  summary: 'Skip links, roving tablist focus, modal focus traps and Escape handling — the a11y testing axe cannot do.',
  concepts: ['toBeFocused', 'keyboard.press', 'focus traps', 'roving tabindex', 'skip links'],
  task: TASK,
  hints: [
    'expect(locator).toBeFocused() retries until the element gains focus — pair it with keyboard.press or a direct focus().',
    'The site header sits earlier in the DOM, so Tab from the body would hit it first. Real audits therefore focus a region first: await page.getByTestId("kb-app").focus() (a tabIndex=-1 container). Tab-order behavior from containers differs per browser engine — asserting the skip-link CONTRACT (it becomes visible and focused) is the deterministic, engine-safe check.',
    'The skip link is visually hidden until focused (CSS .skip-link). "Hidden" here means off-screen — it is still in the accessibility tree, so getByRole("link", { name: "Skip to content" }) finds it, and toBeVisible flips to true once the :focus rule repositions it.',
    'For the focus trap, press Tab MANY times (more than the number of focusables) and then check document.activeElement: await page.evaluate(() => document.activeElement?.closest(\'[role="dialog"]\') !== null).',
    'Escape: page.keyboard.press("Escape") — then assert the dialog is gone AND the opener button regained focus (toBeFocused on the open button).',
  ],
  solution: `test('keyboard-only users can operate the page', async ({ page }) => {
  await page.goto('/real-world/keyboard-nav');

  // the skip link reveals itself when focused — its actual contract
  await page.getByTestId('kb-app').focus();
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await skip.focus();
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  // roving tabindex: arrows move focus AND selection
  await page.getByRole('tab', { name: 'Shipping' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Billing' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Billing' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('kb-panel')).toHaveText('Billing panel');

  // modal focus trap
  await page.getByTestId('kb-open-dialog').click();
  const dialog = page.getByTestId('kb-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('kb-street')).toBeFocused();

  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
  const insideDialog = await page.evaluate(() =>
    document.activeElement?.closest('[role="dialog"]') !== null,
  );
  expect(insideDialog).toBe(true);

  // Escape closes and restores focus to the opener
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('kb-open-dialog')).toBeFocused();
});`,
  example: 'examples/real-world/keyboard-nav.spec.ts',
  path: '/real-world/keyboard-nav',
};
