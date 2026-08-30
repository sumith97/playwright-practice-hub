# 🎭 Playwright Practice Hub

A deliberately testable, full-stack web application where **Test Automation Engineers practice Playwright** against a realistic target — from your first `getByRole` to WebSocket frames, `storageState` sessions, `page.clock` time travel and Page Object architecture.

Every challenge page states the task, lists the Playwright concepts it teaches, gives progressive hints, and links to a **runnable reference test** in [`examples/`](examples/). The reference suite runs against the app on every change — that is what keeps every challenge provably solvable.

## What makes it different

- **32 challenges across 3 tracks** — basic, intermediate and advanced — mapped explicitly to the official Playwright feature surface (locators, auto-wait, `page.route`, `storageState`, `page.clock`, tracing, sharding…).
- **A real backend** (Fastify): practice `request`-fixture API testing, JWT auth with MFA, uploads/downloads, WebSockets and SSE — not just UI clicks.
- **Chaos Mode**: a global toggle that injects latency and DOM re-mounts so you learn to write tests that survive real-world flakiness.
- **Progress tracking** in localStorage — which is itself a storage-assertion challenge.
- **Dogfooded**: ~120 reference tests run in CI across Chromium, Firefox and WebKit.

## Quick start

```bash
npm install                 # installs workspaces (apps/web, apps/api) + tooling
npx playwright install      # downloads the three browser engines

npm run dev                 # starts web (5173) + api (3001) together
```

Open **http://localhost:5173** and pick a challenge. To write your own tests against it:

```bash
npm init playwright@latest  # in a separate folder (or reuse this repo's config)
# set baseURL to http://localhost:5173 and start solving
```

Or run the shipped reference suite (it boots both servers itself):

```bash
npm run test:examples       # Chromium
npm run test:examples:all   # Chromium + Firefox + WebKit
```

## Repository layout

```
├─ apps/
│  ├─ web/        # Vite + React + TS — the practice target SPA
│  │  └─ src/challenges/   # one folder per challenge (component + metadata)
│  └─ api/        # Fastify practice API (auth, CRUD, WS, SSE, uploads)
├─ examples/      # reference Playwright suites, one file per challenge
│  ├─ basic/  intermediate/  advanced/  shop/
│  └─ utils.ts    # loginViaApi, seedSession, reset helpers
├─ docs/          # challenge catalog + API reference
├─ playwright.config.ts     # 3 browser projects, webServer auto-start
└─ .github/workflows/ci.yml # sharded CI with trace artifacts
```

## The curriculum

### 🟢 Basic — foundations (6)
| # | Challenge | Concepts |
|---|---|---|
| 1 | [Locator Gym](/basics/locator-gym) | role / label / placeholder / text / testid / CSS / XPath locators, strict mode |
| 2 | [Actions Playground](/basics/actions-playground) | click, dblclick, right-click, hover, press, check, selectOption, focus/blur |
| 3 | [Form Validation](/basics/form-validation) | fill, disabled/enabled assertions, inline error messages |
| 4 | [Assertions Zoo](/basics/assertions-zoo) | toHaveText/Value/Count/Attribute/Class/URL/Title, visibility |
| 5 | [Navigation Wizard](/basics/navigation-wizard) | client-side routes, waitForURL, goBack, redirects |
| 6 | [First E2E Test](/basics/first-e2e) | the login → dashboard → logout skeleton |

### 🟡 Intermediate — real UI (12)
Waits & auto-waiting · Dynamic content (infinite scroll, polling) · Dropdowns & typeahead · Data tables (sort/filter/paginate) · iFrames · Windows & popups · Dialogs · Drag & drop (incl. canvas) · Files (upload/download) · Network inspection (`page.route`, `waitForResponse`) · Toasts · Clipboard & selection.

### 🔴 Advanced — professional grade (14)
Auth & sessions (JWT + MFA + `storageState`) · API testing (`request` fixture, full error matrix) · Mocking & HAR · WebSockets & SSE · Shadow DOM · Visual testing (masking, baselines) · Clock & timers (`page.clock`) · Storage & cookies · Emulation (geolocation, devices, locale, timezone) · A11y & aria snapshots · Flakiness clinic · Parallelism & sharding · Debugging & tracing · **Capstone: POM & custom fixtures** (a complete e-commerce shop).

See [`docs/challenge-catalog.md`](docs/challenge-catalog.md) for the full table with links and [`docs/api-reference.md`](docs/api-reference.md) for endpoint details.

## The practice API

Real HTTP, same-origin with the SPA (the Vite dev server proxies `/api`, `/auth`, `/ws`, `/sse`):

- `POST /auth/login` — JWT. Demo users: `standard@demo.io` / `secret123`, `admin@demo.io` / `admin123`
- `GET|POST|PUT|DELETE /api/articles` — CRUD with 400/401/404/409 paths
- `POST /api/orders`, `GET /api/products` — the shop capstone
- `GET /api/slow?ms=`, `/api/flaky`, `/api/limited` — timing, retry and 429 practice
- `POST /api/upload`, `GET /api/files/:name/download` — multipart + downloads
- `WS /ws/chat`, `GET /sse/ticker` — realtime
- `POST /api/reset` — restore seed data for per-test isolation

Full reference: [`docs/api-reference.md`](docs/api-reference.md) or the in-app `/api-docs` page.

## Using this to teach or self-study

1. Run the app, open a challenge, read only the task.
2. Write a test for it in your own suite.
3. Stuck? Reveal hints one at a time.
4. Done? Compare with the reference test in `examples/` — and try to make yours cleaner.

Turn on **Chaos Mode** (header toggle) to replay any challenge under injected latency and re-mounts.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | web + api together |
| `npm run dev:web` / `dev:api` | just one of them |
| `npm run build` | production build of the SPA |
| `npm run typecheck` | TS check of the web app |
| `npm run test:examples` | reference suite, Chromium |
| `npm run test:examples:all` | reference suite, all three engines |

## License

MIT — use it, fork it, teach with it.
