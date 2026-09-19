import type { FastifyInstance } from 'fastify';
import {
  store,
  resetStore,
  nextOrderId,
  products,
  type Order,
  type OrderItem,
} from './store.js';
import { findUser, issueOtp, verifyOtp, requireAuth, requireRole, type AuthedRequest } from './auth.js';

function minimalPdf(title: string): Buffer {
  // Build a small but structurally valid PDF with correct xref offsets.
  const encoder = new TextEncoder();
  const stream = `BT /F1 24 Tf 72 700 Td (${title}) Tj ET`;
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    `<</Length ${stream.length}>>stream\n${stream}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

export function registerRoutes(app: FastifyInstance): void {
  // ---- Health & reset -------------------------------------------------------
  app.get('/api/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  app.post('/api/reset', async () => {
    resetStore();
    return { ok: true, message: 'All practice data has been reset' };
  });

  // ---- Auth -----------------------------------------------------------------
  app.post('/auth/login', async (request, reply) => {
    const { email, password } = (request.body ?? {}) as { email?: string; password?: string };
    if (!email || !password) return reply.code(400).send({ error: 'Email and password are required' });
    const found = findUser(email);
    if (!found || found.password !== password) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }
    const token = app.jwt.sign({ ...found.user }, { expiresIn: '2h' });
    return { token, user: found.user };
  });

  app.get('/auth/otp', { preHandler: requireAuth(app) }, async (request: AuthedRequest) => {
    const otp = issueOtp(request.user.email);
    return { otp, expiresInSec: 300, message: `Your verification code is ${otp} (simulated email/SMS)` };
  });

  app.post('/auth/mfa/verify', { preHandler: requireAuth(app) }, async (request: AuthedRequest, reply) => {
    const { otp } = (request.body ?? {}) as { otp?: string };
    if (!otp || !verifyOtp(request.user.email, otp)) {
      return reply.code(400).send({ error: 'Invalid or expired verification code' });
    }
    return { mfa: true, user: request.user };
  });

  app.get('/auth/me', { preHandler: requireAuth(app) }, async (request: AuthedRequest) => ({ user: request.user }));

  // ---- Articles (CRUD) ------------------------------------------------------
  app.get('/api/articles', async (request) => {
    const { tag } = request.query as { tag?: string };
    const list = tag ? store.articles.filter((a) => a.tags.includes(tag)) : store.articles;
    return { articles: list, total: list.length };
  });

  app.get('/api/articles/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const article = store.articles.find((a) => a.id === id);
    if (!article) return reply.code(404).send({ error: `Article ${id} not found` });
    return article;
  });

  app.post('/api/articles', { preHandler: requireAuth(app) }, async (request: AuthedRequest, reply) => {
    const { title, body, tags } = (request.body ?? {}) as { title?: string; body?: string; tags?: string[] };
    if (!title?.trim() || !body?.trim()) {
      return reply.code(400).send({ error: 'Both "title" and "body" are required and must be non-empty' });
    }
    if (store.articles.some((a) => a.title.toLowerCase() === title.trim().toLowerCase())) {
      return reply.code(409).send({ error: `Conflict: an article titled "${title.trim()}" already exists` });
    }
    const article = {
      id: `a-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      tags: Array.isArray(tags) ? tags : [],
    };
    store.articles.push(article);
    return reply.code(201).send(article);
  });

  app.put('/api/articles/:id', { preHandler: requireAuth(app) }, async (request: AuthedRequest, reply) => {
    const { id } = request.params as { id: string };
    const article = store.articles.find((a) => a.id === id);
    if (!article) return reply.code(404).send({ error: `Article ${id} not found` });
    const { title, body, tags } = (request.body ?? {}) as { title?: string; body?: string; tags?: string[] };
    if (title !== undefined) article.title = title;
    if (body !== undefined) article.body = body;
    if (tags !== undefined) article.tags = tags;
    return article;
  });

  app.delete('/api/articles/:id', { preHandler: requireAuth(app) }, async (request: AuthedRequest, reply) => {
    const { id } = request.params as { id: string };
    const index = store.articles.findIndex((a) => a.id === id);
    if (index === -1) return reply.code(404).send({ error: `Article ${id} not found` });
    store.articles.splice(index, 1);
    return reply.code(204).send();
  });

  // ---- Shop: products & orders ---------------------------------------------
  app.get('/api/products', async () => ({ products, total: products.length }));

  app.post('/api/orders', { preHandler: requireAuth(app) }, async (request: AuthedRequest, reply) => {
    const { items } = (request.body ?? {}) as { items?: { productId: string; quantity: number }[] };
    if (!Array.isArray(items) || items.length === 0) {
      return reply.code(400).send({ error: '"items" must be a non-empty array of { productId, quantity }' });
    }
    const orderItems: OrderItem[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return reply.code(400).send({ error: `Unknown productId: ${item.productId}` });
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return reply.code(400).send({ error: `Invalid quantity for ${product.name}: must be an integer 1-99` });
      }
      orderItems.push({ productId: product.id, name: product.name, quantity, priceCents: product.priceCents });
    }
    const order: Order = {
      id: nextOrderId(),
      email: request.user.email,
      items: orderItems,
      totalCents: orderItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    store.orders.push(order);
    return reply.code(201).send(order);
  });

  app.get('/api/orders', { preHandler: requireAuth(app) }, async (request: AuthedRequest) => ({
    orders: store.orders.filter((o) => o.email === request.user.email),
  }));

  app.get('/api/admin/stats', { preHandler: requireRole(app, 'admin') }, async () => ({
    articles: store.articles.length,
    orders: store.orders.length,
    uploads: store.uploads.length,
    uptimeSec: Math.round(process.uptime()),
  }));

  // ---- Analytics beacons (Real World track) ----------------------------------
  app.post('/api/analytics', async (request, reply) => {
    const { event, props } = (request.body ?? {}) as { event?: string; props?: Record<string, unknown> };
    if (!event?.trim()) return reply.code(400).send({ error: 'An "event" name is required' });
    store.analytics.push({ event: event.trim(), props: props ?? {}, ts: Date.now() });
    return { ok: true, received: store.analytics.length };
  });

  app.get('/api/analytics', async () => ({ events: store.analytics.slice(-50) }));

  // ---- Performance practice asset (Real World track) -------------------------
  app.get('/api/perf/asset', async (_request, reply) => {
    reply
      .header('Content-Type', 'image/svg+xml')
      .header('Cache-Control', 'no-store');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="#4f46e5" rx="8"/><circle cx="35" cy="30" r="12" fill="#fff"/><rect x="55" y="22" width="50" height="16" fill="#fff" rx="4"/></svg>';
  });

  // ---- Reservations (parallelism practice) ----------------------------------
  app.post('/api/reserve/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (store.reservations.has(id)) {
      return reply.code(409).send({ error: `Slot ${id} is already reserved` });
    }
    store.reservations.add(id);
    return reply.code(201).send({ id, status: 'reserved' });
  });

  app.get('/api/reservations', async () => ({ reserved: [...store.reservations] }));

  // ---- Timing / reliability playground --------------------------------------
  app.get('/api/slow', async (request, reply) => {
    const { ms } = request.query as { ms?: string };
    const delay = Math.min(Math.max(Number(ms) || 0, 0), 15_000);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return { ok: true, waitedMs: delay };
  });

  app.get('/api/flaky', async (_request, reply) => {
    store.flakyAttempts += 1;
    if (store.flakyAttempts <= 2) {
      return reply.code(500).send({ error: `Flaky endpoint failed (attempt ${store.flakyAttempts} of 2)` });
    }
    return { ok: true, attempts: store.flakyAttempts };
  });

  app.get('/api/limited', async (request, reply) => {
    // Buckets are keyed by x-client-id when provided (lets parallel tests
    // isolate themselves) and fall back to the caller IP.
    const clientId = request.headers['x-client-id'];
    const bucketKey = (Array.isArray(clientId) ? clientId[0] : clientId) ?? request.ip;
    const now = Date.now();
    const bucket = store.rateBuckets.get(bucketKey);
    if (!bucket || now > bucket.resetAt) {
      store.rateBuckets.set(bucketKey, { count: 1, resetAt: now + 10_000 });
      return { ok: true, message: 'Request allowed', requestsRemaining: 2 };
    }
    bucket.count += 1;
    if (bucket.count > 3) {
      reply.header('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return reply.code(429).send({ error: 'Too many requests: rate limit is 3 per 10 seconds' });
    }
    return { ok: true, message: 'Request allowed', requestsRemaining: 3 - bucket.count };
  });

  // ---- Uploads & downloads ----------------------------------------------------
  app.post('/api/upload', async (request, reply) => {
    try {
      const file = await request.file();
      if (!file) return reply.code(400).send({ error: 'No file part found in the multipart payload' });
      const buffer = await file.toBuffer();
      const stored = { name: file.filename, size: buffer.length, content: buffer };
      store.uploads.push(stored);
      return reply.code(201).send({
        name: stored.name,
        size: stored.size,
        message: `Received ${stored.name} (${stored.size} bytes)`,
      });
    } catch (err: any) {
      return reply.code(400).send({ error: `Upload failed: ${err?.message ?? 'malformed multipart payload'}` });
    }
  });

  app.get('/api/files', async () => ({
    files: store.uploads.map((f) => ({ name: f.name, size: f.size })),
  }));

  app.get('/api/files/report.pdf/download', async (_request, reply) => {
    const pdf = minimalPdf('Playwright Practice Hub - Quarterly Report');
    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename="quarterly-report.pdf"')
      .send(pdf);
  });

  app.get('/api/files/logs.txt/download', async (_request, reply) => {
    const logs = [
      '2026-08-30T09:00:01Z INFO  test-runner started',
      '2026-08-30T09:00:04Z INFO  challenge=locator-gym passed',
      '2026-08-30T09:00:09Z WARN  challenge=flaky retry 1/2',
      '2026-08-30T09:00:12Z INFO  challenge=flaky passed after retry',
      '2026-08-30T09:00:15Z INFO  test-runner finished',
    ].join('\n');
    reply
      .header('Content-Type', 'text/plain; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="test-logs.txt"')
      .send(logs);
  });

  app.get('/api/files/:name/download', async (request, reply) => {
    const { name } = request.params as { name: string };
    const file = store.uploads.find((f) => f.name === name);
    if (!file) return reply.code(404).send({ error: `File "${name}" has not been uploaded in this session` });
    reply
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename="${file.name}"`)
      .send(file.content);
  });
}
