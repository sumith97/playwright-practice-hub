import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Real apps never hold still. Practice asserting against moving targets:

1. Scroll the feed to the bottom — more items lazy-load as you scroll (also try the "Load more" button). The feed stops at 30 items.
2. The price widget polls every 2 seconds — assert the price CHANGES over time without hard-coded waits.
3. Click "Reload list" — the list nodes are fully replaced (old elements are detached!). Prove your test survives that.
4. Click "Start stream" — a new table row appears roughly every second until 8 rows exist. Assert the final count.`;

const BATCH = 5;
const MAX_ITEMS = 30;

export default function DynamicContent() {
  const [items, setItems] = useState(() => Array.from({ length: BATCH }, (_, i) => ({ id: i + 1, title: `Feed item ${i + 1}` })));
  const [price, setPrice] = useState(42.5);
  const [priceUpdates, setPriceUpdates] = useState(0);
  const [listKey, setListKey] = useState(0);
  const [streamRows, setStreamRows] = useState<{ id: number; label: string }[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setItems((prev) => {
          if (prev.length >= MAX_ITEMS) return prev;
          const next = [...prev];
          while (next.length < Math.min(MAX_ITEMS, next.length + BATCH)) {
            next.push({ id: next.length + 1, title: `Feed item ${next.length + 1}` });
          }
          return next;
        });
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Price polling
  useEffect(() => {
    const id = window.setInterval(() => {
      setPrice((p) => Number((p + (Math.random() - 0.45) * 2).toFixed(2)));
      setPriceUpdates((u) => u + 1);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  // Row stream
  const startStream = () => {
    setStreamRows([]);
    const id = window.setInterval(() => {
      setStreamRows((rows) => {
        if (rows.length >= 8) {
          window.clearInterval(id);
          return rows;
        }
        return [...rows, { id: rows.length + 1, label: `Event ${rows.length + 1}` }];
      });
    }, 1000);
  };

  const LIST = ['Alpha component', 'Beta component', 'Gamma component', 'Delta component'];

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
      <div className="card">
        <h3>Infinite scroll feed</h3>
        <p className="small muted">
          Loaded: <strong data-testid="feed-count">{items.length}</strong> / {MAX_ITEMS}
        </p>
        <div className="feed" data-testid="feed" style={{ maxHeight: 220 }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{ boxShadow: 'none', padding: '0.5rem 0.8rem' }}>
              {item.title}
            </div>
          ))}
          <div ref={sentinelRef} data-testid="feed-sentinel" style={{ height: 8 }} />
        </div>
        <button
          type="button"
          className="btn subtle"
          style={{ marginTop: '0.6rem' }}
          data-testid="load-more"
          onClick={() =>
            setItems((prev) => {
              if (prev.length >= MAX_ITEMS) return prev;
              const next = [...prev];
              while (next.length < Math.min(MAX_ITEMS, next.length + BATCH)) {
                next.push({ id: next.length + 1, title: `Feed item ${next.length + 1}` });
              }
              return next;
            })
          }
        >
          Load more
        </button>
      </div>

      <div className="card">
        <h3>Polled price</h3>
        <p className="ticker" data-testid="live-price">
          ${price.toFixed(2)}
        </p>
        <p className="small muted">
          Updates: <span data-testid="price-updates">{priceUpdates}</span> (every 2s)
        </p>
      </div>

      <div className="card">
        <h3>Remounting list</h3>
        <button type="button" className="btn subtle" data-testid="reload-list" onClick={() => setListKey((k) => k + 1)}>
          Reload list
        </button>
        <ul key={listKey} data-testid="component-list" style={{ marginTop: '0.7rem' }}>
          {LIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="small muted" data-testid="list-generation">
          Generation #{listKey + 1} — the DOM nodes above are brand new.
        </p>
      </div>

      <div className="card">
        <h3>Row stream</h3>
        <button type="button" className="btn subtle" data-testid="start-stream" onClick={startStream}>
          Start stream
        </button>
        <table className="data" style={{ marginTop: '0.7rem' }} data-testid="stream-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Event</th>
            </tr>
          </thead>
          <tbody>
            {streamRows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'dynamic-content',
  track: 'intermediate',
  title: 'Dynamic Content',
  summary: 'Infinite scroll, polled prices, remounting DOM nodes and streaming rows — assert against a moving target.',
  concepts: ['infinite scroll', 'IntersectionObserver', 'polling assertions', 'detached elements', 'locator re-resolution'],
  task: TASK,
  hints: [
    'Scroll programmatically: page.getByTestId("feed").hover() then page.mouse.wheel(0, 600) — or simply use the "Load more" button. Assert counts with toHaveCount / toHaveText.',
    'For the polled price, read it twice with expect.poll or assert that the "Updates" counter is greater than 1: expect.poll(() => Number(text)).toBeGreaterThan(1).',
    'When elements remount, locators re-resolve automatically — that is the point of getByTestId. The "Generation #" label increments on each reload; assert it after clicking.',
  ],
  solution: `test('moving targets', async ({ page }) => {
  await page.goto('/intermediate/dynamic-content');

  // lazy loading via scroll
  await page.getByTestId('feed').hover();
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 500);
  }
  await expect(page.getByTestId('feed-count')).not.toHaveText('5');

  // polled price changes over time
  await expect.poll(async () => Number(await page.getByTestId('price-updates').textContent()))
    .toBeGreaterThan(1);

  // remounting nodes
  await page.getByTestId('reload-list').click();
  await expect(page.getByTestId('list-generation')).toHaveText(/Generation #2/);

  // streaming rows
  await page.getByTestId('start-stream').click();
  await expect(page.getByTestId('stream-table').locator('tbody tr')).toHaveCount(8, { timeout: 12_000 });
});`,
  example: 'examples/intermediate/dynamic-content.spec.ts',
  path: '/intermediate/dynamic-content',
};
