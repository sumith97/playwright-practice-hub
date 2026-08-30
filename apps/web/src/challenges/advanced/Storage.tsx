import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Client-side state lives in three places — read and write all of them:

1. Toggle the theme — it persists in localStorage and survives a page reload. Assert with page.evaluate(() => localStorage.getItem("pph.theme")) and by reloading.
2. Write a note in the session box — sessionStorage keeps it, but only for the current tab.
3. Click "Accept cookies" — a real cookie "pph_consent" is set. Assert it via context.cookies() and delete it via context.clearCookies().
4. The visit counter increments on every page load — reload the page and assert it grows.`;

const THEME_KEY = 'pph.theme';
const NOTE_KEY = 'pph.session-note';

export default function Storage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'));
  const [note, setNote] = useState(() => sessionStorage.getItem(NOTE_KEY) ?? '');
  const [consent, setConsent] = useState<string>(() => (document.cookie.match(/pph_consent=([^;]+)/)?.[1] ?? 'none'));
  const [visits, setVisits] = useState(0);

  const countedRef = useRef(false);
  useEffect(() => {
    // React StrictMode mounts effects twice in dev — count each real page load once
    if (countedRef.current) return;
    countedRef.current = true;
    const key = 'pph.visits';
    const next = Number(localStorage.getItem(key) ?? '0') + 1;
    localStorage.setItem(key, String(next));
    setVisits(next);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    sessionStorage.setItem(NOTE_KEY, note);
  }, [theme, note]);

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
      <div className="card">
        <h3>Theme (localStorage)</h3>
        <div className={`theme-demo ${theme}`} data-testid="theme-demo" style={{ marginBottom: '0.7rem' }}>
          {theme === 'dark' ? '🌙 Dark theme active' : '☀️ Light theme active'}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button type="button" className="btn subtle" data-testid="set-light" onClick={() => setTheme('light')}>
            Light
          </button>
          <button type="button" className="btn subtle" data-testid="set-dark" onClick={() => setTheme('dark')}>
            Dark
          </button>
        </div>
        <p className="small muted">
          localStorage["pph.theme"] = <code data-testid="theme-value">{theme}</code>
        </p>
      </div>

      <div className="card">
        <h3>Scratch note (sessionStorage)</h3>
        <div className="field">
          <label htmlFor="session-note">Note (this tab only)</label>
          <textarea id="session-note" data-testid="session-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <p className="small muted">
          sessionStorage["pph.session-note"] = <code data-testid="note-value">{note || '(empty)'}</code>
        </p>
      </div>

      <div className="card">
        <h3>Cookie consent</h3>
        <button
          type="button"
          className="btn"
          data-testid="accept-cookies"
          onClick={() => {
            document.cookie = 'pph_consent=granted; path=/; max-age=3600';
            setConsent('granted');
          }}
        >
          Accept cookies
        </button>{' '}
        <button
          type="button"
          className="btn subtle"
          data-testid="reject-cookies"
          onClick={() => {
            document.cookie = 'pph_consent=denied; path=/; max-age=3600';
            setConsent('denied');
          }}
        >
          Deny
        </button>
        <p className="small muted" style={{ marginTop: '0.7rem' }}>
          Cookie pph_consent = <code data-testid="consent-value">{consent}</code>
        </p>
      </div>

      <div className="card">
        <h3>Visit counter (localStorage)</h3>
        <p>
          This page has been loaded <strong data-testid="visit-count">{visits}</strong> time(s) in this browser.
        </p>
        <p className="small muted">Reload and watch it grow.</p>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'storage',
  track: 'advanced',
  title: 'Web Storage & Cookies',
  summary: 'Read, write and assert localStorage, sessionStorage and cookies — and seed them before the app boots.',
  concepts: ['page.evaluate storage access', 'context.cookies()', 'clearCookies', 'addInitScript', 'state seeding'],
  task: TASK,
  hints: [
    'Storage lives in the browser: const theme = await page.evaluate(() => localStorage.getItem("pph.theme")). Seeding works with page.addInitScript(() => localStorage.setItem(...)) BEFORE goto.',
    'Cookies belong to the context: (await context.cookies()).find((c) => c.name === "pph_consent") — and await context.clearCookies() removes them all.',
    'To assert persistence, change the theme, await page.reload(), then assert the demo box still shows the dark class.',
  ],
  solution: `test('theme persists across reloads', async ({ page }) => {
  await page.goto('/advanced/storage');
  await page.getByTestId('set-dark').click();
  await expect(page.getByTestId('theme-value')).toHaveText('dark');

  await page.reload();
  await expect(page.getByTestId('theme-demo')).toHaveClass(/dark/);
  await expect(page.getByTestId('visit-count')).toHaveText('2');
});

test('seed localStorage before the app boots', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pph.theme', 'dark');
    localStorage.setItem('pph.visits', '41');
  });
  await page.goto('/advanced/storage');
  await expect(page.getByTestId('theme-demo')).toHaveClass(/dark/);
  await expect(page.getByTestId('visit-count')).toHaveText('42');
});

test('cookie consent round-trip', async ({ page }) => {
  await page.goto('/advanced/storage');
  await page.getByTestId('accept-cookies').click();
  await expect(page.getByTestId('consent-value')).toHaveText('granted');

  const cookie = (await page.context().cookies()).find((c) => c.name === 'pph_consent');
  expect(cookie?.value).toBe('granted');

  await page.context().clearCookies();
  await page.reload();
  await expect(page.getByTestId('consent-value')).toHaveText('none');
});

test('sessionStorage stays in the tab', async ({ page }) => {
  await page.goto('/advanced/storage');
  await page.getByTestId('session-note').fill('remember the milk');
  await page.reload();
  await expect(page.getByTestId('note-value')).toHaveText('remember the milk');
});`,
  example: 'examples/advanced/storage.spec.ts',
  path: '/advanced/storage',
};
