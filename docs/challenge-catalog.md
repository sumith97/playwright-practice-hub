# Challenge catalog

All 39 challenges, their routes, and the Playwright concepts they exercise.
Reference tests live in `examples/` at the path shown in each challenge page.

## Basic track — foundations

| # | Challenge | Route | Concepts | Reference test |
|---|---|---|---|---|
| 1 | Locator Gym | `/basics/locator-gym` | getByRole/Label/Placeholder/Text/TestId, CSS & XPath, strict mode | `examples/basic/locator-gym.spec.ts` |
| 2 | Actions Playground | `/basics/actions-playground` | click, dblclick, right-click, hover, press, check/uncheck, selectOption, focus/blur | `examples/basic/actions-playground.spec.ts` |
| 3 | Form Validation | `/basics/form-validation` | fill, toBeDisabled/Enabled, asserting inline errors | `examples/basic/form-validation.spec.ts` |
| 4 | Assertions Zoo | `/basics/assertions-zoo` | toHaveText/Value/Count/Attribute/Class, toHaveURL/Title, toBeVisible/Hidden | `examples/basic/assertions-zoo.spec.ts` |
| 5 | Navigation Wizard | `/basics/navigation-wizard` | client-side routing, waitForURL, page.goBack, redirects, spinners | `examples/basic/navigation-wizard.spec.ts` |
| 6 | First E2E Test | `/basics/first-e2e` | complete login flow, role="alert", table row counts | `examples/basic/first-e2e.spec.ts` |

## Intermediate track — real-world UI

| # | Challenge | Route | Concepts | Reference test |
|---|---|---|---|---|
| 7 | Waits & Auto-waiting | `/intermediate/waits` | auto-waiting, assertion timeouts, expect.poll, transient elements | `examples/intermediate/waits.spec.ts` |
| 8 | Dynamic Content | `/intermediate/dynamic-content` | infinite scroll, polling updates, detached nodes, streaming rows | `examples/intermediate/dynamic-content.spec.ts` |
| 9 | Dropdowns & Typeahead | `/intermediate/dropdowns` | selectOption (single/multi), custom listboxes, debounced input | `examples/intermediate/dropdowns.spec.ts` |
| 10 | Data Tables | `/intermediate/data-tables` | sorting (aria-sort), filtering, pagination, row-scoped locators | `examples/intermediate/data-tables.spec.ts` |
| 11 | iFrames | `/intermediate/iframes` | frameLocator, nested frames, auto-waiting for frames, postMessage | `examples/intermediate/iframes.spec.ts` |
| 12 | Windows & Popups | `/intermediate/windows-popups` | waitForEvent('popup'), target=_blank, window.open, opener messaging | `examples/intermediate/windows-popups.spec.ts` |
| 13 | Dialogs | `/intermediate/dialogs` | page.on('dialog'), accept/dismiss, beforeunload, custom modals | `examples/intermediate/dialogs.spec.ts` |
| 14 | Drag & Drop | `/intermediate/drag-drop` | dragTo, click-based reordering, slider fill, raw mouse canvas drawing | `examples/intermediate/drag-drop.spec.ts` |
| 15 | Files | `/intermediate/files` | setInputFiles (buffers/arrays), multipart upload, download events, saveAs | `examples/intermediate/files.spec.ts` |
| 16 | Network Inspection | `/intermediate/network` | page.route fulfill/abort, waitForResponse, request/response pairing | `examples/intermediate/network.spec.ts` |
| 17 | Toasts & Transient UI | `/intermediate/toasts` | appear/disappear assertions, stacked elements, aria-live regions | `examples/intermediate/toasts.spec.ts` |
| 18 | Clipboard & Selection | `/intermediate/clipboard` | clipboard permissions, page.evaluate, selection API | `examples/intermediate/clipboard.spec.ts` |

## Advanced track — professional grade

| # | Challenge | Route | Concepts | Reference test |
|---|---|---|---|---|
| 19 | Auth & Sessions | `/advanced/auth` | JWT login via API, MFA/OTP, role-based access, storageState seeding | `examples/advanced/auth.spec.ts` |
| 20 | API Testing | `/advanced/api-testing` | request fixture, CRUD lifecycle, 400/401/403/404/409/429 matrix | `examples/advanced/api-testing.spec.ts` |
| 21 | Mocking & HAR | `/advanced/mocking` | fulfill 500s, latency injection, setOffline, recordHar/routeFromHAR | `examples/advanced/mocking.spec.ts` |
| 22 | WebSockets & SSE | `/advanced/realtime` | waitForEvent('websocket'), framereceived, EventSource streams | `examples/advanced/realtime.spec.ts` |
| 23 | Shadow DOM | `/advanced/shadow-dom` | shadow-piercing locators, nested shadow roots | `examples/advanced/shadow-dom.spec.ts` |
| 24 | Visual Testing | `/advanced/visual` | toHaveScreenshot, masking, fullPage, maxDiffPixelRatio, baselines | `examples/advanced/visual.spec.ts` |
| 25 | Clock & Timers | `/advanced/clock` | page.clock.install/pauseAt/runFor, time-dependent UI | `examples/advanced/clock.spec.ts` |
| 26 | Storage & Cookies | `/advanced/storage` | localStorage/sessionStorage via evaluate, context.cookies, addInitScript | `examples/advanced/storage.spec.ts` |
| 27 | Emulation | `/advanced/emulation` | geolocation + permissions, colorScheme, devices, locale, timezoneId | `examples/advanced/emulation.spec.ts` |
| 28 | A11y & ARIA Snapshots | `/advanced/a11y` | toMatchAriaSnapshot, live regions, axe-core integration | `examples/advanced/a11y.spec.ts` |
| 29 | Flakiness Clinic | `/advanced/flakiness` | remounting DOM, auto-wait under re-renders, retries vs isolation | `examples/advanced/flakiness.spec.ts` |
| 30 | Parallelism & Control | `/advanced/parallelism` | fullyParallel, unique test data, workers, shards, grep/tags | `examples/advanced/parallelism.spec.ts` |
| 31 | Debugging & Tracing | `/advanced/debugging` | trace viewer, soft assertions, failure artifacts, retry loops | `examples/advanced/debugging.spec.ts` |
| 32 | Capstone: POM & Fixtures | `/shop` | Page Object Model, custom fixtures, API-seeded sessions, shop E2E | `examples/shop/capstone.spec.ts` |

## Expert track — modern Playwright

| # | Challenge | Route | Concepts | Reference test |
|---|---|---|---|---|
| 33 | Setup Project & storageState | `/expert/setup-auth` | setup projects, project dependencies, storageState file, testIgnore | `examples/expert/setup-auth.spec.ts` (+ `auth.setup.ts`) |
| 34 | HAR Record & Replay | `/expert/har` | routeFromHAR, recordHar, updateMode, setOffline | `examples/expert/har.spec.ts` |
| 35 | Overlay Clinic | `/expert/locator-handler` | addLocatorHandler, actionability interception, times option | `examples/expert/locator-handler.spec.ts` |
| 36 | Console & Page-Error Monitoring | `/expert/error-monitor` | page.on('pageerror'/'console'), auto fixtures, error policy | `examples/expert/error-monitor.spec.ts` |
| 37 | Steps, Attachments & Tracing | `/expert/steps-attachments` | test.step, testInfo.attach, context.tracing | `examples/expert/steps-attachments.spec.ts` |
| 38 | Network Surgery | `/expert/network-surgery` | route.fetch + fulfill patching, { times }, route.fallback, LIFO | `examples/expert/network-surgery.spec.ts` |
| 39 | Worker-Scoped Fixtures | `/expert/worker-fixtures` | test.extend, scope:'worker', auto fixtures, workerIndex | `examples/expert/worker-fixtures.spec.ts` |

## Concept coverage map

| Playwright docs area | Challenges |
|---|---|
| Locators & strict mode | 1, 10, 32 |
| Actions & keyboard | 2, 14 |
| Auto-waiting & assertions | 3, 4, 7, 17 |
| Pages, frames & popups | 5, 11, 12 |
| Dialogs | 13 |
| Files (upload/download) | 15 |
| Network, mocking, HAR | 16, 21 |
| WebSockets / SSE | 22 |
| Auth & storageState | 19, 26, 32 |
| API testing | 20 |
| Visual comparisons | 24 |
| Clock emulation | 25 |
| Device/permission emulation | 27 |
| Accessibility | 28 |
| Parallelism & sharding | 30 |
| Fixtures & POM | 32, 39 |
| Debugging & tracing | 31, 37 |
| Flakiness & retries | 7, 29, 31, 35 (+ Chaos Mode anywhere) |
| Setup projects & auth architecture | 19, 33 |
| HAR | 21, 34 |
| Modern assertions & locators | 4, 28, 38 |
