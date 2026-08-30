import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Clipboard and text selection live in browser APIs your tests can grant and inspect:

1. Click "Copy token" — the token is written to the clipboard via navigator.clipboard. You will need the clipboard-read and clipboard-write permissions in your test context.
2. Assert the "Copied!" confirmation appears.
3. Read the clipboard back (page.evaluate(() => navigator.clipboard.readText())) and assert it equals the token.
4. Click "Select first sentence" — the page selects text programmatically; assert the reported selection.`;

const TOKEN = 'PW-2026-HUB-TOKEN';
const SENTENCE = 'Assertions are the heart of every trustworthy test suite.';

export default function Clipboard() {
  const [copied, setCopied] = useState(false);
  const [selection, setSelection] = useState('');

  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  const selectFirstSentence = () => {
    const span = spanRef.current;
    if (!span) return;
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    setSelection(sel?.toString() ?? '');
  };

  return (
    <div className="card">
      <h3>Copy to clipboard</h3>
      <p>
        Deployment token: <code data-testid="token">{TOKEN}</code>{' '}
        <button
          type="button"
          className="btn subtle"
          data-testid="copy-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(TOKEN);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          Copy token
        </button>
      </p>
      {copied && (
        <p className="success-text" data-testid="copied-confirmation">
          Copied!
        </p>
      )}

      <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
      <h3>Text selection</h3>
      <p>
        <span ref={spanRef} data-testid="sentence">{SENTENCE}</span>
      </p>
      <button type="button" className="btn subtle" data-testid="select-button" onClick={selectFirstSentence}>
        Select first sentence
      </button>
      <p className="status-region" data-testid="selection-result">
        {selection ? `Selected: "${selection}"` : 'Nothing selected yet.'}
      </p>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'clipboard',
  track: 'intermediate',
  title: 'Clipboard & Selection',
  summary: 'Grant clipboard permissions, assert clipboard contents, and verify programmatic text selection.',
  concepts: ['permissions', 'clipboard API', 'page.evaluate', 'selection API'],
  task: TASK,
  hints: [
    'Chromium needs permissions before the page may read the clipboard: test.use({ permissions: ["clipboard-read", "clipboard-write"] }) or context.grantPermissions([...]).',
    'Read it back inside the browser (the Node side has no clipboard): const value = await page.evaluate(() => navigator.clipboard.readText());',
    'The selection is reported in the status region — and you can also assert window.getSelection().toString() via page.evaluate.',
  ],
  solution: `test('clipboard and selection', async ({ browser }) => {
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  await page.goto('/intermediate/clipboard');

  await page.getByTestId('copy-button').click();
  await expect(page.getByTestId('copied-confirmation')).toBeVisible();

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe('PW-2026-HUB-TOKEN');

  await page.getByTestId('select-button').click();
  await expect(page.getByTestId('selection-result')).toContainText('Assertions are the heart');
  await context.close();
});`,
  example: 'examples/intermediate/clipboard.spec.ts',
  path: '/intermediate/clipboard',
};
