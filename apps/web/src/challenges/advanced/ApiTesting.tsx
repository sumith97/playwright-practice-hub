import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `This challenge is solved almost entirely in your test file with the request fixture:

1. Login via POST /auth/login and extract the token.
2. GET /api/articles — assert 200 and 5 seeded articles.
3. POST a new article with the token — assert 201 and read back its id.
4. POST the same title again — assert 409 Conflict.
5. POST without a token — assert 401.
6. PUT the article — assert 200; DELETE it — assert 204; GET it again — assert 404.
7. Try DELETE /api/articles/a-1 as the standard user, then check a 403 endpoint as admin.

Use the "Request console" below to explore endpoints interactively, but the real solution is request-fixture code.`;

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;

export default function ApiTesting() {
  const [method, setMethod] = useState<(typeof METHODS)[number]>('GET');
  const [url, setUrl] = useState('/api/articles');
  const [body, setBody] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    setResult('');
    try {
      const token = localStorage.getItem('pph.token');
      const options: RequestInit = { method, headers: {} };
      if (token) (options.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      if (body.trim() && method !== 'GET') {
        (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
        options.body = body;
      }
      const response = await fetch(url, options);
      const text = await response.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // not JSON
      }
      setResult(`HTTP ${response.status} ${response.statusText}\n\n${pretty || '(empty body)'}`);
    } catch (err) {
      setResult(`Request failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="card" data-testid="request-console">
        <h3>Request console</h3>
        <p className="small muted">
          Your saved JWT (from the Auth challenge) is attached automatically. Uses the same-origin proxy.
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select aria-label="HTTP method" data-testid="console-method" value={method} onChange={(e) => setMethod(e.target.value as (typeof METHODS)[number])} style={{ width: 110 }}>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input
            aria-label="Request URL"
            data-testid="console-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <button type="button" className="btn" data-testid="console-send" onClick={send} disabled={busy}>
            {busy ? 'Sending…' : 'Send'}
          </button>
        </div>
        <textarea
          aria-label="Request body (JSON)"
          data-testid="console-body"
          placeholder='{"title": "...", "body": "..."}'
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          style={{ width: '100%', marginTop: '0.7rem', fontFamily: 'var(--mono)' }}
        />
        {result && (
          <pre data-testid="console-result" style={{ marginTop: '0.8rem', whiteSpace: 'pre-wrap' }}>
            <code>{result}</code>
          </pre>
        )}
      </div>

      <div className="panel" style={{ marginTop: '1.2rem' }}>
        <h3>Cheatsheet: the request fixture</h3>
        <pre>
          <code>{`const res = await request.post('/auth/login', {
  data: { email: 'admin@demo.io', password: 'admin123' },
});
const { token } = await res.json();

const created = await request.post('/api/articles', {
  headers: { Authorization: 'Bearer ' + token },
  data: { title: 'Fresh', body: 'Content', tags: ['new'] },
});
expect(created.status()).toBe(201);
const article = await created.json();`}</code>
        </pre>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'api-testing',
  track: 'advanced',
  title: 'API Testing',
  summary: 'Drive the practice API with the request fixture: CRUD, auth tokens, and the full HTTP error matrix.',
  concepts: ['request fixture', 'REST CRUD', 'status codes (401/403/404/409)', 'chained requests', 'schema checks'],
  task: TASK,
  hints: [
    'The request fixture shares baseURL with page tests: await request.get("/api/articles") hits http://localhost:5173/api/articles and the proxy forwards it.',
    'Chain requests: create → capture the id from the response body → update → delete → verify 404. That is the CRUD lifecycle in one test.',
    'Error matrix: 401 = missing/invalid token, 403 = wrong role (use the admin stats endpoint), 404 = unknown id, 409 = duplicate article title, 429 = hammer /api/limited more than 3 times in 10s.',
  ],
  solution: `import { test, expect } from '@playwright/test';

test('full CRUD lifecycle with auth', async ({ request }) => {
  // token
  const login = await request.post('/auth/login', {
    data: { email: 'standard@demo.io', password: 'secret123' },
  });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  const auth = { Authorization: \`Bearer \${token}\` };

  // read
  const list = await request.get('/api/articles');
  expect(list.status()).toBe(200);
  expect((await list.json()).articles).toHaveLength(5);

  // create
  const created = await request.post('/api/articles', {
    headers: auth,
    data: { title: 'Fixture-driven testing', body: 'Created by a reference test.', tags: ['api'] },
  });
  expect(created.status()).toBe(201);
  const { id } = await created.json();

  // duplicate -> 409
  const duplicate = await request.post('/api/articles', {
    headers: auth,
    data: { title: 'Fixture-driven testing', body: 'again' },
  });
  expect(duplicate.status()).toBe(409);

  // unauthorized -> 401
  const anonymous = await request.post('/api/articles', {
    data: { title: 'No token', body: 'nope' },
  });
  expect(anonymous.status()).toBe(401);

  // update + delete + verify gone
  const updated = await request.put(\`/api/articles/\${id}\`, {
    headers: auth,
    data: { title: 'Renamed by PUT' },
  });
  expect(updated.status()).toBe(200);

  const removed = await request.delete(\`/api/articles/\${id}\`, { headers: auth });
  expect(removed.status()).toBe(204);
  const gone = await request.get(\`/api/articles/\${id}\`);
  expect(gone.status()).toBe(404);
});

test('admin endpoint enforces roles', async ({ request }) => {
  await request.post('/api/reset');
  const asStandard = await request.get('/api/admin/stats');
  expect(asStandard.status()).toBe(401);
});`,
  example: 'examples/advanced/api-testing.spec.ts',
  path: '/advanced/api-testing',
};
