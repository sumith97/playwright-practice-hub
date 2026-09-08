import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch } from '../../lib/api';

const TASK = `Freeze reality into a HAR file, then run the app with no backend at all:

1. Record: open a context with routeFromHAR(har, { update: true }), load this page, click "Load articles" — real traffic passes through and is captured into the HAR.
2. Close the recording context (the HAR is written on close).
3. Replay: open a NEW context with routeFromHAR(har) (no update), put it offline with context.setOffline(true), and load the page again.
4. Click "Load articles" — the data arrives from the frozen HAR even though the network is dead. Assert it.

This is how you write UI tests that never flake on backend data — and how you demo frontends without a staging environment.`;

interface Article {
  id: string;
  title: string;
}

export default function HarReplay() {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [loads, setLoads] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const load = async () => {
    setStatus('loading');
    try {
      const data = await apiFetch<{ articles: Article[] }>('/api/articles');
      setArticles(data.articles);
      setStatus('success');
      setLoads((n) => n + 1);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="card" data-testid="har-widget" data-status={status}>
      <h3>Articles loader</h3>
      <p className="small muted">
        Fetches <code>GET /api/articles</code> on demand. In replay mode this data comes from the HAR file.
      </p>
      <button type="button" className="btn" data-testid="har-load" onClick={load}>
        Load articles
      </button>
      <p className="small muted" data-testid="har-loads">
        Loads this session: {loads}
      </p>
      <p className="status-region" data-testid="har-status">
        {status === 'loading' ? (
          <span className="spinner" aria-label="Loading" />
        ) : (
          status === 'error' ? 'Request failed (are you offline without a HAR?)' : `Status: ${status}`
        )}
      </p>
      {articles && (
        <ul data-testid="har-list">
          {articles.map((a) => (
            <li key={a.id}>{a.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'har-replay',
  track: 'expert',
  title: 'HAR Record & Replay',
  summary: 'Record real network traffic into a HAR file, then run the UI completely offline against frozen traffic.',
  concepts: ['routeFromHAR', 'recordHar', 'update / updateMode', 'setOffline', 'network independence'],
  task: TASK,
  hints: [
    'With update: true the context behaves normally (requests hit the real API) while every request/response is written to the HAR. The file is written when the context CLOSES — do not forget await context.close().',
    'updateMode defaults to "minimal" (only non-static/API requests); use updateMode: "full" to also capture page assets, so you can replay a full page load offline.',
    'On replay (no update flag), requests NOT in the HAR are aborted — anything your page loads beyond the recorded traffic will fail. That strictness is the feature.',
    'Engine note: navigating WHILE offline against a HAR works on Chromium; Firefox/WebKit throw NS_ERROR_OFFLINE before the HAR layer gets involved. The reference test skips them for exactly that reason.',
    'Write the HAR to testInfo.outputPath("articles.har") so it lands in test artifacts and never collides between parallel tests.',
  ],
  solution: `test('record traffic once, replay offline', async ({ browser }, testInfo) => {
  const harPath = testInfo.outputPath('articles.har');

  // phase 1 — record: update mode passes real traffic through and captures it
  const recording = await browser.newContext();
  await recording.routeFromHAR(harPath, { update: true, updateMode: 'all' });
  const page = await recording.newPage();
  await page.goto('/expert/har');
  await page.getByTestId('har-load').click();
  await expect(page.getByTestId('har-list').locator('li')).toHaveCount(5);
  await recording.close(); // HAR file is written here

  // phase 2 — replay: same traffic, zero network
  const replay = await browser.newContext();
  await replay.routeFromHAR(harPath);
  await replay.setOffline(true);
  const offlinePage = await replay.newPage();
  await offlinePage.goto('/expert/har');
  await offlinePage.getByTestId('har-load').click();
  await expect(offlinePage.getByTestId('har-list').locator('li')).toHaveCount(5);
  await expect(offlinePage.getByTestId('har-status')).toHaveAttribute('data-status', 'success');
  await replay.close();
});`,
  example: 'examples/expert/har.spec.ts',
  path: '/expert/har',
};
