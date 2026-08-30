# Practice API reference

Base URL: same origin as the SPA (`http://localhost:5173`) — the Vite dev server proxies `/api`, `/auth`, `/ws` and `/sse` to the Fastify backend on port 3001. All bodies are JSON unless stated.

## Demo users

| Email | Password | Role |
|---|---|---|
| `standard@demo.io` | `secret123` | user |
| `admin@demo.io` | `admin123` | admin |

## Health & test isolation

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness probe: `{ status: "ok", time }`. |
| POST | `/api/reset` | Restores ALL in-memory data (articles, orders, uploads, reservations, flaky counter, rate buckets). Use in setup/beforeAll when a suite needs a clean slate. |

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | — | `{ email, password }` → `{ token, user }`. JWT expires in 2h. 401 on bad credentials. |
| GET | `/auth/otp` | Bearer | Issues a 6-digit MFA code for the current user (simulated email/SMS): `{ otp, expiresInSec }`. |
| POST | `/auth/mfa/verify` | Bearer | `{ otp }` → `{ mfa: true, user }`. 400 when invalid/expired. |
| GET | `/auth/me` | Bearer | Current user profile from the token. |

## Articles (CRUD playground)

| Method | Path | Auth | Status codes |
|---|---|---|---|
| GET | `/api/articles` (`?tag=`) | — | 200 `{ articles, total }` (5 seeded) |
| GET | `/api/articles/:id` | — | 200 · 404 unknown id |
| POST | `/api/articles` | Bearer | 201 · 400 missing title/body · 401 no token · 409 duplicate title |
| PUT | `/api/articles/:id` | Bearer | 200 · 404 |
| DELETE | `/api/articles/:id` | Bearer | 204 · 404 |

## Shop (capstone)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | — | 8 seeded products with `priceCents`. |
| POST | `/api/orders` | Bearer | `{ items: [{ productId, quantity }] }` → 201 with server-computed `totalCents` and `ORD-####` id. 400 on unknown product or qty outside 1–99. |
| GET | `/api/orders` | Bearer | Orders belonging to the authenticated user. |

## Reservations (parallelism practice)

| Method | Path | Description |
|---|---|---|
| POST | `/api/reserve/:id` | 201 on first reservation of an id, 409 for every later one — a collision-free playground for parallel suites. |
| GET | `/api/reservations` | `{ reserved: string[] }`. |

## Timing, flakiness & limits

| Method | Path | Description |
|---|---|---|
| GET | `/api/slow?ms=1500` | Responds after `ms` (capped at 15 000). Practice `waitForResponse` and timeouts. |
| GET | `/api/flaky` | Fails with 500 exactly twice per reset window, then 200 with the attempt count. Practice retries / `expect.poll`. |
| GET | `/api/limited` | Rate limit: 3 requests per 10s per client, then 429 with `Retry-After`. **Parallel-safe:** send an `x-client-id` header to get a private bucket instead of your IP's shared one. |

## Files

| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | Multipart, field name `file` (max 5 MB) → 201 `{ name, size, message }`. |
| GET | `/api/files` | Files uploaded during this server session. |
| GET | `/api/files/report.pdf/download` | Generated PDF with `Content-Disposition: attachment`. |
| GET | `/api/files/logs.txt/download` | Sample log file (5 lines). |
| GET | `/api/files/:name/download` | Re-download something uploaded this session. 404 otherwise. |

## Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Bearer **admin** | 401 without token, 403 for `role: user`, 200 counts for admin. |

## Realtime

| Transport | Path | Description |
|---|---|---|
| WebSocket | `/ws/chat` | Send `{ user, text }` (or plain text); every client receives `{ type: "message" \| "system", user?, text, ts }`. New connections get a welcome system message. |
| SSE | `/sse/ticker` | Event stream: `{ symbol: "PWL", price, ts }` every second. |
