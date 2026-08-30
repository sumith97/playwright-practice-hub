import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

const ENDPOINTS: { method: string; path: string; auth?: string; description: string }[] = [
  { method: 'POST', path: '/auth/login', description: 'Authenticate. Body: { email, password }. Returns { token, user }.' },
  { method: 'GET', path: '/auth/otp', auth: 'Bearer', description: 'Issue a 6-digit MFA code for the current user (simulated email/SMS).' },
  { method: 'POST', path: '/auth/mfa/verify', auth: 'Bearer', description: 'Verify the MFA code. Body: { otp }.' },
  { method: 'GET', path: '/auth/me', auth: 'Bearer', description: 'Current user profile from the token.' },
  { method: 'GET', path: '/api/articles', description: 'List articles. Optional ?tag=<tag> filter.' },
  { method: 'POST', path: '/api/articles', auth: 'Bearer', description: 'Create article. 400 when title/body missing, 409 on duplicate title.' },
  { method: 'PUT', path: '/api/articles/:id', auth: 'Bearer', description: 'Update an article. 404 when unknown id.' },
  { method: 'DELETE', path: '/api/articles/:id', auth: 'Bearer', description: 'Delete an article. 204 on success, 404 when unknown id.' },
  { method: 'GET', path: '/api/products', description: 'Shop catalog: { products: [{ id, name, priceCents, category }] }.' },
  { method: 'POST', path: '/api/orders', auth: 'Bearer', description: 'Place an order. Body: { items: [{ productId, quantity }] }. Server computes totals.' },
  { method: 'GET', path: '/api/orders', auth: 'Bearer', description: 'Orders of the authenticated user.' },
  { method: 'POST', path: '/api/reserve/:id', description: 'Reserve a unique slot. 201 first time, 409 afterwards — parallel-safe by design.' },
  { method: 'GET', path: '/api/slow?ms=1500', description: 'Responds after `ms` delay (max 15000). Practice waitForResponse / timeouts.' },
  { method: 'GET', path: '/api/flaky', description: 'Fails with 500 twice, then succeeds. Practice retries / expect.poll.' },
  { method: 'GET', path: '/api/limited', description: 'Rate limited to 3 requests per 10s per IP, then 429 + Retry-After.' },
  { method: 'POST', path: '/api/upload', description: 'Multipart upload (field name: file). Returns { name, size }.' },
  { method: 'GET', path: '/api/files', description: 'Files uploaded in this session.' },
  { method: 'GET', path: '/api/files/report.pdf/download', description: 'Download a generated PDF (Content-Disposition: attachment).' },
  { method: 'GET', path: '/api/files/logs.txt/download', description: 'Download a text log file.' },
  { method: 'GET', path: '/api/admin/stats', auth: 'Bearer (admin)', description: 'Admin-only metrics. 401 without token, 403 for non-admin role.' },
  { method: 'WS', path: '/ws/chat', description: 'WebSocket chat: send { user, text }, receive broadcasts + system messages.' },
  { method: 'GET', path: '/sse/ticker', description: 'Server-Sent Events stream of { symbol: "PWL", price, ts } every second.' },
  { method: 'POST', path: '/api/reset', description: 'Reset all in-memory practice data (articles, orders, uploads, flaky counters, rate limits).' },
];

export function ApiDocs() {
  const [health, setHealth] = useState<string>('not checked');
  useEffect(() => {
    document.title = 'API Docs — Playwright Practice Hub';
  }, []);

  return (
    <>
      <h1>Practice API documentation</h1>
      <p className="muted">
        These endpoints are served same-origin with the app (proxied to the practice API), so your tests can simply
        use <code>request.post('/auth/login')</code> with <code>baseURL: 'http://localhost:5173'</code>.
      </p>

      <div className="panel">
        <h2>Health check</h2>
        <p className="small muted">
          Quick connectivity probe — useful to verify the API is up before tests run:
        </p>
        <button
          type="button"
          className="btn subtle"
          data-testid="health-check"
          onClick={async () => {
            try {
              const res = await apiFetch<{ status: string; time: string }>('/api/health');
              setHealth(`ok — ${res.time}`);
            } catch {
              setHealth('unreachable — is `npm run dev -w apps/api` running?');
            }
          }}
        >
          Check API health
        </button>
        <p data-testid="health-result">{health}</p>
      </div>

      <div className="panel api-docs">
        <h2>Endpoints</h2>
        <table className="data">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Auth</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((e) => (
              <tr key={e.method + e.path}>
                <td>
                  <span className={`method ${e.method}`}>{e.method}</span>
                </td>
                <td>
                  <code className="path">{e.path}</code>
                </td>
                <td className="small">{e.auth ?? '—'}</td>
                <td className="small">{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Demo users</h2>
        <table className="data">
          <thead>
            <tr>
              <th>Email</th>
              <th>Password</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>standard@demo.io</code>
              </td>
              <td>
                <code>secret123</code>
              </td>
              <td>user</td>
            </tr>
            <tr>
              <td>
                <code>admin@demo.io</code>
              </td>
              <td>
                <code>admin123</code>
              </td>
              <td>admin</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
