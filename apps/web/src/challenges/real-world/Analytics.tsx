import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Pricing pages, checkouts, signups — every real product fires analytics. Verify them like a pro:

1. This widget fires tracking events on every action: a product_viewed when the page opens, item_added / purchase_completed when you click. Each one POSTs to /api/analytics AND is pushed to a window.__analytics array in the page.
2. Spy on the NETWORK: intercept or observe POST /api/analytics and assert the purchase_completed event carries the right payload (orderId, total).
3. Harvest events in Node: page.exposeBinding('__onTrack', ...) BEFORE goto, and collect every event the page fires without touching the network at all.
4. Cross-check: the visible event log in the UI, the network spy, and your binding must agree on the count.`;

interface TrackedEvent {
  event: string;
  props: Record<string, unknown>;
}

export default function Analytics() {
  const [log, setLog] = useState<string[]>([]);
  const [sent, setSent] = useState(0);
  const counted = useRef(false);

  useEffect(() => {
    // test hooks — seeded before load by the reference test's addInitScript
    const w = window as unknown as { __analytics?: TrackedEvent[]; __onTrack?: (e: TrackedEvent) => void };
    w.__analytics ??= [];

    if (counted.current) return;
    counted.current = true;
    void track('product_viewed', { productId: 'p-9', page: '/real-world/analytics' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const track = async (event: string, props: Record<string, unknown>) => {
    const payload = { event, props };
    const w = window as unknown as { __analytics?: TrackedEvent[]; __onTrack?: (e: TrackedEvent) => void };
    w.__analytics?.push(payload);
    w.__onTrack?.(payload);
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // beacons are traditionally fire-and-forget
    }
    setSent((n) => n + 1);
    setLog((l) => [...l.slice(-7), `${event} ${JSON.stringify(props)}`]);
  };

  return (
    <div>
      <div className="card">
        <h3>Mini product page</h3>
        <p>
          <span aria-hidden="true" style={{ fontSize: '2rem' }}>🛰️</span>{' '}
          <strong>Telemetry Transceiver</strong> — <span className="price">$71.42</span>
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', margin: '0.8rem 0' }}>
          <button type="button" className="btn subtle" data-testid="track-add" onClick={() => void track('item_added', { productId: 'p-9', quantity: 1 })}>
            Add to cart
          </button>
          <button
            type="button"
            className="btn"
            data-testid="track-purchase"
            onClick={() => void track('purchase_completed', { orderId: 'ORD-7731', total: 71.42, currency: 'USD' })}
          >
            Buy now
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Event log (what the UI knows)</h3>
        <p className="small muted">
          Events sent this session: <strong data-testid="analytics-count">{sent}</strong> · product_viewed fires once on page load.
        </p>
        <div className="feed" data-testid="analytics-log" style={{ maxHeight: 180 }}>
          {log.length === 0 ? (
            <span className="muted small">No events yet…</span>
          ) : (
            log.map((line, i) => (
              <div key={i} className="mono small">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'analytics',
  track: 'real-world',
  title: 'Analytics & Tracking Verification',
  summary: 'Assert that product analytics fire with the right payloads — via network spies and exposeBinding harvests.',
  concepts: ['page.on("request")', 'waitForRequest', 'route interception', 'exposeBinding', 'event payloads'],
  task: TASK,
  hints: [
    'Network spy: page.on("request", (req) => { if (req.url().includes("/api/analytics")) captured.push(req.postDataJSON()); }) — register before the action. postDataJSON() parses the beacon body for you.',
    'exposeBinding runs your NODE callback whenever the page calls the bound function: await page.exposeBinding("__onTrack", (_source, event) => { collected.push(event); }) — register it before page.goto so the page-load event is captured too.',
    'exposeBinding vs exposeFunction: the binding receives a Playwright handle as first argument and can drive the page; exposeFunction is the plain callback. Both must be registered before navigation.',
    'Agreement check: the UI counter, the network captures and the binding collection can lag each other by a tick — use expect.poll when comparing counts.',
  ],
  solution: `test('purchase fires the right analytics, three ways', async ({ page }) => {
  // 1) harvest in Node via a binding (registered BEFORE goto)
  const collected: any[] = [];
  await page.exposeBinding('__onTrack', (_source, event) => collected.push(event));

  // 2) spy on the network beacons
  const beacons: any[] = [];
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().includes('/api/analytics')) {
      beacons.push(req.postDataJSON());
    }
  });

  await page.goto('/real-world/analytics');
  await page.getByTestId('track-add').click();
  await page.getByTestId('track-purchase').click();

  // UI, network and binding must all agree
  await expect(page.getByTestId('analytics-count')).toHaveText('3');
  await expect
    .poll(() => beacons.filter((b) => b.event === 'purchase_completed').length)
    .toBe(1);
  expect(collected.map((e) => e.event)).toEqual(
    expect.arrayContaining(['product_viewed', 'item_added', 'purchase_completed']),
  );

  const purchase = beacons.find((b) => b.event === 'purchase_completed');
  expect(purchase.props).toMatchObject({ orderId: 'ORD-7731', total: 71.42 });
});`,
  example: 'examples/real-world/analytics.spec.ts',
  path: '/real-world/analytics',
};
