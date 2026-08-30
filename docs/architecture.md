# Architecture

Diagrams render natively on GitHub. Sources of truth: `apps/web`, `apps/api`, `examples/`, `.github/workflows/ci.yml`.

## 1. System architecture

```mermaid
flowchart TB
    subgraph learner["🧑‍💻 Test Automation Engineer"]
        direction TB
        SUITE["Your Playwright tests<br/>(examples/ = reference suite)"]
        RUNNER["Playwright runner<br/>workers · shards · traces"]
        BR["Browser<br/>Chromium · Firefox · WebKit"]
        SUITE --> RUNNER --> BR
    end

    subgraph web["🖥️ apps/web — Vite + React 18 SPA · :5173"]
        direction TB
        UI["React Router app shell<br/>/ · /track/:track · /api-docs"]
        CH["32 challenge pages<br/>task · hints · solution · playground"]
        SHOP["Capstone shop<br/>login → catalog → cart → checkout → orders → admin"]
        XTRA["Chaos Mode · localStorage progress · toasts"]
        PROXY["Vite dev proxy<br/>/api · /auth · /ws · /sse"]
        UI --> CH
        UI --> SHOP
        CH -.-> XTRA
    end

    subgraph api["⚙️ apps/api — Fastify · :3001"]
        direction TB
        AUTH["JWT auth + MFA<br/>/auth/login · /auth/otp · /auth/mfa/verify"]
        CRUD["/api/articles CRUD<br/>201 · 400 · 401 · 404 · 409"]
        BIZ["/api/products · /api/orders<br/>/api/admin/stats (RBAC)"]
        NET["/api/slow · /api/flaky<br/>/api/limited (429)"]
        FILES["/api/upload<br/>/api/files/*/download"]
        RT["WS /ws/chat<br/>SSE /sse/ticker"]
        UTIL["POST /api/reset<br/>POST /api/reserve/:id"]
        MEM[("In-memory store<br/>seeded · resettable")]
    end

    BR -->|"loads"| UI
    BR -->|"fetch / WS / SSE"| PROXY
    PROXY --> api
    SUITE -->|"request fixture<br/>(direct API calls)"| api
    AUTH --> MEM
    CRUD --> MEM
    BIZ --> MEM
    NET --> MEM
    FILES --> MEM
    UTIL --> MEM
    RT --> MEM
```

The test suite talks to the app twice: once through the **browser** (UI
interactions) and once **directly** via the `request` fixture (auth and API
testing challenges). Everything the API serves comes from one **resettable
in-memory store**, which makes per-test isolation a single `POST /api/reset`.

## 2. Capstone shop flow (the POM practice target)

```mermaid
flowchart LR
    L["Login<br/>JWT → localStorage"] --> C["Catalog<br/>search · filter · skeletons"]
    C -->|"Add to cart ×N<br/>(8 buttons: strict-mode trap)"| CART["Cart<br/>qty ± · remove · $ total"]
    CART -->|"requires auth<br/>(guests redirected)"| CO["Checkout<br/>validated form · 16-digit card"]
    CO -->|"POST /api/orders"| OK["Confirmation<br/>ORD-#### · total charged"]
    OK --> O["Orders<br/>history"]
    C -.-> A["Admin<br/>403 for user · 200 for admin"]
```

## 3. CI pipeline

```mermaid
flowchart LR
    PUSH["git push / PR"] --> CI["GitHub Actions<br/>npm ci · playwright install · typecheck"]
    CI --> S1["shard 1/3"] & S2["shard 2/3"] & S3["shard 3/3"]
    S1 & S2 & S3 --> T["npx playwright test<br/>Chromium · Firefox · WebKit<br/>(webServer auto-start)"]
    T -->|"failure"| ART["traces · videos · screenshots<br/>→ artifacts"]
    T -->|"always"| RPT["HTML report<br/>→ artifact"]
```
