import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch } from '../../lib/api';

const TASK = `This widget talks to the practice API — intercept it with page.route():

1. Click "Load articles" — the list populates from GET /api/articles.
2. Mock the articles endpoint: route.fulfill a payload with YOUR titles and assert the widget renders them (API mocking without touching the server).
3. Click "Load slow (2s)" — use page.waitForResponse to await it, or simply assert the final state.
4. Block or abort the slow endpoint with route.abort() — assert the widget shows the error state.
5. "Trigger flaky" fails twice then succeeds — a perfect playground for request retries (page.route supports handling on retry too).
6. Assert the request actually happened: the widget logs method, URL and status of the last response.`;

interface Article {
  id: string;
  title: string;
  body: string;
}

export default function Network() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [articles, setArticles] = useState<Article[]>([]);
  const [message, setMessage] = useState('');
  const [lastRequest, setLastRequest] = useState('');

  const run = async (label: string, url: string, after: (data: any) => void) => {
    setStatus('loading');
    setMessage('');
    try {
      const started = performance.now();
      const data = await apiFetch(url);
      const ms = Math.round(performance.now() - started);
      after(data);
      setStatus('success');
      setLastRequest(`GET ${url} → 200 OK in ${ms}ms`);
    } catch (err) {
      setStatus('error');
      setLastRequest(`GET ${url} → failed`);
      setMessage(err instanceof Error ? err.message : 'Request failed');
    }
    void label;
  };

  return (
    <div className="card" data-status={status} data-testid="network-widget">
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn" data-testid="load-articles" onClick={() => run('articles', '/api/articles', (data) => setArticles(data.articles))}>
          Load articles
        </button>
        <button type="button" className="btn secondary" data-testid="load-slow" onClick={() => run('slow', '/api/slow?ms=2000', () => setMessage('Slow endpoint answered after its nap.'))}>
          Load slow (2s)
        </button>
        <button type="button" className="btn secondary" data-testid="trigger-flaky" onClick={() => run('flaky', '/api/flaky', (data) => setMessage(`Flaky endpoint succeeded (attempt ${data.attempts}).`))}>
          Trigger flaky
        </button>
      </div>

      <p className="small muted" data-testid="last-request" style={{ marginTop: '0.8rem' }}>
        {lastRequest || 'No requests yet.'}
      </p>
      <p className="status-region" data-status={status} data-testid="network-status">
        {status === 'loading' ? (
          <span className="spinner" aria-label="Loading" />
        ) : (
          message || `Status: ${status}`
        )}
      </p>

      {articles.length > 0 && (
        <ul data-testid="article-list">
          {articles.map((a) => (
            <li key={a.id}>
              <strong>{a.title}</strong> — <span className="muted">{a.body}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'network',
  track: 'intermediate',
  title: 'Network Inspection',
  summary: 'Mock, modify and abort API traffic with page.route; await responses; assert request/response pairs.',
  concepts: ['page.route', 'route.fulfill', 'route.abort', 'waitForResponse', 'request/response assertions'],
  task: TASK,
  hints: [
    'Mock before navigating or before clicking: await page.route("**/api/articles", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ articles: [...], total: 1 }) }));',
    'Await a specific response: const responsePromise = page.waitForResponse((res) => res.url().includes("/api/slow")); await button.click(); const response = await responsePromise; expect(response.status()).toBe(200);',
    'Abort: await page.route("**/api/slow**", (route) => route.abort("failed")). The widget then shows the error state — assert data-testid="network-widget" has data-status="error".',
  ],
  solution: `test('intercept the network', async ({ page }) => {
  await page.goto('/intermediate/network');

  // 1. real request
  await page.getByTestId('load-articles').click();
  await expect(page.getByTestId('article-list').locator('li')).toHaveCount(5);
  await expect(page.getByTestId('last-request')).toContainText('200 OK');

  // 2. mock the endpoint with our own payload
  await page.route('**/api/articles', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        articles: [{ id: 'x-1', title: 'Mocked headline', body: 'from route.fulfill', tags: [] }],
        total: 1,
      }),
    }),
  );
  await page.getByTestId('load-articles').click();
  await expect(page.getByTestId('article-list')).toContainText('Mocked headline');

  // 3. wait for a specific response
  const responsePromise = page.waitForResponse((res) => res.url().includes('/api/slow'));
  await page.getByTestId('load-slow').click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);

  // 4. abort the slow endpoint -> error state
  await page.unrouteAll();
  await page.route('**/api/slow**', (route) => route.abort('failed'));
  await page.getByTestId('load-slow').click();
  await expect(page.getByTestId('network-widget')).toHaveAttribute('data-status', 'error');
});`,
  example: 'examples/intermediate/network.spec.ts',
  path: '/intermediate/network',
};
