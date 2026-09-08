import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch } from '../../lib/api';
import { formatPrice } from '../../lib/types';

const TASK = `Go beyond fulfill/abort — operate on the REAL response, scope mocks, and chain handlers:

1. Patch reality: intercept GET /api/products with route.fetch() (let the real request happen), modify the JSON (rename the first product to end with "(BETA)"), and fulfill with the patched response.
2. Scope a mock with { times: 2 }: mock the products endpoint for the FIRST TWO loads only — the third load must hit the real API (the widget counts loads; watch the first product's name flip back).
3. Chain handlers: register two matching routes where the first calls route.fallback() and the second does the patching. Learn Playwright's LIFO handler order.
4. Assert all three behaviors via the first product's name in the list.`;

interface Product {
  id: string;
  name: string;
  priceCents: number;
}

export default function NetworkSurgery() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loads, setLoads] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const load = async () => {
    setStatus('loading');
    try {
      const data = await apiFetch<{ products: Product[] }>('/api/products');
      setProducts(data.products);
      setLoads((n) => n + 1);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="card" data-testid="surgery-widget">
      <h3>Products (server truth, or your patched version of it)</h3>
      <button type="button" className="btn" data-testid="surgery-load" onClick={load}>
        Load products
      </button>
      <p className="small muted" data-testid="surgery-loads">
        Loads this session: {loads}
      </p>
      <p className="status-region" data-testid="surgery-status">
        {status === 'loading' ? <span className="spinner" aria-label="Loading" /> : `Status: ${status}`}
      </p>
      {products.length > 0 && (
        <table className="data" data-testid="surgery-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td data-testid={i === 0 ? 'product-first-name' : undefined}>{p.name}</td>
                <td className="price">{formatPrice(p.priceCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'network-surgery',
  track: 'expert',
  title: 'Network Surgery',
  summary: 'route.fetch to patch real responses, { times } for scoped mocks, route.fallback for handler chains.',
  concepts: ['route.fetch()', 'fulfill with modified response', 'route { times }', 'route.fallback()', 'LIFO handlers'],
  task: TASK,
  hints: [
    'route.fetch() performs the actual request. You get a real APIResponse: const json = await response.json(); change it; then route.fulfill({ response, json }) keeps the original headers/status with your body.',
    'The third route argument is an options object: page.route(url, handler, { times: 2 }) — the handler runs for the first 2 matching requests only; later requests pass through untouched.',
    'Handlers run in LIFO order (last registered, first executed). route.fallback() defers to the NEXT matching handler — this is how you layer generic and specific interceptors.',
    'Reset between behaviors with page.unrouteAll() — otherwise earlier handlers keep intercepting later assertions.',
  ],
  solution: `test('patch the real response instead of faking it', async ({ page }) => {
  await page.route('**/api/products', async (route) => {
    const response = await route.fetch(); // real request happens
    const json = await response.json();
    json.products[0].name += ' (BETA)';
    await route.fulfill({ response, json });
  });
  await page.goto('/expert/network-surgery');
  await page.getByTestId('surgery-load').click();
  await expect(page.getByTestId('product-first-name')).toHaveText(/\\(BETA\\)$/);
});

test('times: mock only the first two loads', async ({ page }) => {
  await page.route('**/api/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ products: [{ id: 'x', name: 'MOCKED', priceCents: 1, category: 'mock', emoji: '🧪' }] }),
    });
  }, { times: 2 });

  await page.goto('/expert/network-surgery');
  const firstName = page.getByTestId('product-first-name');
  await page.getByTestId('surgery-load').click();
  await expect(firstName).toHaveText('MOCKED');
  await page.getByTestId('surgery-load').click();
  await expect(firstName).toHaveText('MOCKED');
  await page.getByTestId('surgery-load').click(); // times exhausted -> real API
  await expect(firstName).not.toHaveText('MOCKED');
});

test('fallback chains handlers (LIFO: last registered runs first)', async ({ page }) => {
  await page.route('**/api/products', (route) => route.fallback()); // registered first, runs second
  await page.route('**/api/products', async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    json.products[0].name += ' (via fallback)';
    await route.fulfill({ response, json });
  });
  await page.goto('/expert/network-surgery');
  await page.getByTestId('surgery-load').click();
  await expect(page.getByTestId('product-first-name')).toHaveText(/via fallback/);
});`,
  example: 'examples/expert/network-surgery.spec.ts',
  path: '/expert/network-surgery',
};
