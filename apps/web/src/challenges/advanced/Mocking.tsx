import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch } from '../../lib/api';

const TASK = `Break the network on purpose — and prove the app copes:

1. Record a HAR while loading data: route-based or context recordHar (see hints), then replay it with page.routeFromHAR.
2. Fulfill the articles endpoint with a 500 response via route.fulfill — assert the widget's error state.
3. Add artificial latency with a delayed fulfill — assert the skeleton/loading state appears first.
4. Put the page offline with context.setOffline(true) — the offline banner must appear; go back online and it disappears.
5. Call the admin endpoint without a token — the widget logs the 401 gracefully.`;

interface Article {
  id: string;
  title: string;
  body: string;
}

export default function Mocking() {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [lastStatus, setLastStatus] = useState('');

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const loadArticles = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const data = await apiFetch<{ articles: Article[] }>('/api/articles');
      setArticles(data.articles);
      setStatus('success');
      setLastStatus('GET /api/articles → 200');
    } catch (err) {
      setStatus('error');
      setLastStatus('GET /api/articles → failed');
      setMessage(err instanceof Error ? err.message : 'Request failed');
    }
  };

  const callProtected = async () => {
    setStatus('loading');
    try {
      const token = localStorage.getItem('pph.token');
      const res = await fetch('/api/admin/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setLastStatus(`GET /api/admin/stats → ${res.status}`);
      setStatus(res.ok ? 'success' : 'error');
      setMessage(res.ok ? 'Protected endpoint answered.' : `Protected endpoint answered with HTTP ${res.status}.`);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Request failed');
    }
  };

  return (
    <div>
      {!online && (
        <p className="status-region err" data-testid="offline-banner" role="alert">
          ⚠ You are offline — requests will fail until connectivity returns.
        </p>
      )}

      <div className="card" data-testid="mocking-widget" data-status={status}>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn" data-testid="load-data" onClick={loadArticles}>
            Load server data
          </button>
          <button type="button" className="btn secondary" data-testid="call-protected" onClick={callProtected}>
            Call protected endpoint
          </button>
        </div>
        <p className="small muted" data-testid="last-status" style={{ marginTop: '0.7rem' }}>
          {lastStatus || 'No requests yet.'}
        </p>

        {status === 'loading' && (
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.8rem' }} data-testid="skeleton-list">
            <div className="skeleton" style={{ width: '70%' }} />
            <div className="skeleton" style={{ width: '55%' }} />
            <div className="skeleton" style={{ width: '62%' }} />
          </div>
        )}
        {status === 'error' && (
          <p className="status-region err" data-testid="error-state">
            {message || 'Something went wrong.'}
          </p>
        )}
        {status === 'success' && articles && (
          <ul data-testid="articles">
            {articles.map((a) => (
              <li key={a.id}>{a.title}</li>
            ))}
          </ul>
        )}
      </div>

      <p className="small muted" style={{ marginTop: '0.8rem' }}>
        Tip: <code>POST /api/reset</code> clears server state between tests; <code>GET /api/slow?ms=…</code> gives you a
        configurable latency target for HAR replays.
      </p>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'mocking',
  track: 'advanced',
  title: 'Network Mocking & HAR',
  summary: 'Fulfill with 500s, inject latency, go offline, and record/replay real traffic with HAR files.',
  concepts: ['route.fulfill (500)', 'delayed responses', 'context.setOffline', 'recordHar / routeFromHAR', 'graceful degradation'],
  task: TASK,
  hints: [
    'Failure injection: await page.route("**/api/articles", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Internal server error" }) })); then assert the error state.',
    'Latency injection: fulfill with a delay — await new Promise((r) => setTimeout(r, 1500)) inside the route handler; assert the skeleton-list is visible BEFORE the data arrives.',
    'Offline: await context.setOffline(true); expect(page.getByTestId("offline-banner")).toBeVisible(); await context.setOffline(false) to restore. The banner listens to real online/offline events.',
    'HAR: newContext({ recordHar: { path: "traffic.har" } }) — browse, close the context, then replay in another test with page.routeFromHAR("traffic.har").',
  ],
  solution: `test('graceful 500 handling', async ({ page }) => {
  await page.route('**/api/articles', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal server error' }) }),
  );
  await page.goto('/advanced/mocking');
  await page.getByTestId('load-data').click();
  await expect(page.getByTestId('mocking-widget')).toHaveAttribute('data-status', 'error');
  await expect(page.getByTestId('error-state')).toContainText('Internal server error');
});

test('latency shows the skeleton first', async ({ page }) => {
  await page.route('**/api/articles', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto('/advanced/mocking');
  await page.getByTestId('load-data').click();
  await expect(page.getByTestId('skeleton-list')).toBeVisible();
  await expect(page.getByTestId('articles')).toBeVisible({ timeout: 5000 });
});

test('offline banner', async ({ page }) => {
  await page.goto('/advanced/mocking');
  await page.context().setOffline(true);
  await expect(page.getByTestId('offline-banner')).toBeVisible();
  await page.context().setOffline(false);
  await expect(page.getByTestId('offline-banner')).toBeHidden();
});`,
  example: 'examples/advanced/mocking.spec.ts',
  path: '/advanced/mocking',
};
