import { test, expect } from '@playwright/test';
import { loginViaApi, STANDARD_USER } from '../utils';

/**
 * These specs share one API server with the rest of the suite, so they follow
 * the golden rule of parallel-safe testing: never mutate shared state and
 * never assert on global counts — use unique payloads instead.
 */
test.describe('Advanced · API Testing', () => {
  let token: string;

  test.beforeEach(async ({ request }) => {
    token = (await loginViaApi(request, STANDARD_USER)).token;
  });

  test('read the seeded catalog', async ({ request }) => {
    const res = await request.get('/api/articles');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.total).toBeGreaterThanOrEqual(5);
    expect(body.articles[0]).toMatchObject({ id: 'a-1', title: expect.any(String), tags: expect.any(Array) });
  });

  test('tag filter narrows the list', async ({ request }) => {
    const res = await request.get('/api/articles?tag=basics');
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(body.articles.every((a: any) => a.tags.includes('basics'))).toBeTruthy();
  });

  test('full CRUD lifecycle with the error matrix', async ({ request }) => {
    const auth = { Authorization: `Bearer ${token}` };
    const uniqueTitle = `Fixture-driven testing ${Date.now()}`;

    const created = await request.post('/api/articles', {
      headers: auth,
      data: { title: uniqueTitle, body: 'Created by a reference test.', tags: ['api'] },
    });
    expect(created.status()).toBe(201);
    const article = await created.json();
    expect(article.id).toMatch(/^a-/);

    const duplicate = await request.post('/api/articles', {
      headers: auth,
      data: { title: uniqueTitle, body: 'again' },
    });
    expect(duplicate.status()).toBe(409);

    const anonymous = await request.post('/api/articles', {
      data: { title: 'No token', body: 'nope' },
    });
    expect(anonymous.status()).toBe(401);

    const missingFields = await request.post('/api/articles', {
      headers: auth,
      data: { title: 'No body field' },
    });
    expect(missingFields.status()).toBe(400);

    const updated = await request.put(`/api/articles/${article.id}`, {
      headers: auth,
      data: { title: `${uniqueTitle} (renamed)` },
    });
    expect(updated.status()).toBe(200);
    expect((await updated.json()).title).toContain('(renamed)');

    const removed = await request.delete(`/api/articles/${article.id}`, { headers: auth });
    expect(removed.status()).toBe(204);

    const gone = await request.get(`/api/articles/${article.id}`);
    expect(gone.status()).toBe(404);
  });

  test('orders validate their payload', async ({ request }) => {
    const auth = { Authorization: `Bearer ${token}` };

    const badProduct = await request.post('/api/orders', {
      headers: auth,
      data: { items: [{ productId: 'p-999', quantity: 1 }] },
    });
    expect(badProduct.status()).toBe(400);

    const order = await request.post('/api/orders', {
      headers: auth,
      data: { items: [{ productId: 'p-1', quantity: 2 }, { productId: 'p-6', quantity: 1 }] },
    });
    expect(order.status()).toBe(201);
    const body = await order.json();
    expect(body.totalCents).toBe(1200 * 2 + 850);
    expect(body.id).toMatch(/^ORD-\d{4}$/);

    // own-orders list contains the order this test just created
    const mine = await request.get('/api/orders', { headers: auth });
    const ids = (await mine.json()).orders.map((o: any) => o.id);
    expect(ids).toContain(body.id);
  });

  test('role enforcement on admin stats', async ({ request }) => {
    const asUser = await request.get('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(asUser.status()).toBe(403);

    const anonymous = await request.get('/api/admin/stats');
    expect(anonymous.status()).toBe(401);
  });

  test('rate limiter returns 429 with Retry-After', async ({ request }) => {
    // a private x-client-id bucket keeps this test immune to parallel traffic
    const clientId = `rate-test-${Date.now()}`;
    const headers = { 'x-client-id': clientId };

    const first = await request.get('/api/limited', { headers });
    expect(first.status()).toBe(200);
    expect((await first.json()).requestsRemaining).toBe(2);

    await request.get('/api/limited', { headers });
    const third = await request.get('/api/limited', { headers });
    expect((await third.json()).requestsRemaining).toBe(0);

    const fourth = await request.get('/api/limited', { headers });
    expect(fourth.status()).toBe(429);
    expect(fourth.headers()['retry-after']).toBeTruthy();
    expect((await fourth.json()).error).toContain('rate limit');
  });
});
