import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Make tests readable in the trace viewer and self-documenting in reports:

1. Structure the purchase flow with test.step("...") — open, configure, place — so the trace shows named steps instead of a flat list of clicks.
2. Attach the outgoing order payload as order-payload.json (testInfo.attach with contentType application/json) and the confirmation text as confirmation.txt.
3. Open the HTML report (npm run report) or a trace and find your steps and attachments.
4. Bonus: wrap part of the flow in context.tracing.start()/stop({ path }) to produce a standalone trace.zip, independent of the config-level setting.`;

const PRODUCTS = [
  { id: 'p-1', name: 'Locator Lens', price: '$12.00' },
  { id: 'p-2', name: 'Assertion Owl', price: '$24.50' },
  { id: 'p-3', name: 'Fixture Fox', price: '$18.99' },
];

export default function StepsAttachments() {
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [order, setOrder] = useState<{ id: string; name: string; qty: number; total: string } | null>(null);

  const place = () => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    const quantity = Math.max(1, Math.min(99, Number(qty) || 1));
    const price = Number(product.price.replace(/[$.]/g, ''));
    const total = `$${((price * quantity) / 100).toFixed(2)}`;
    setOrder({
      id: `ORD-${String(Math.floor(1000 + Math.random() * 9000))}`,
      name: product.name,
      qty: quantity,
      total,
    });
  };

  return (
    <div className="card">
      <h3>Mini order form</h3>
      <div className="field">
        <label htmlFor="step-product">Product</label>
        <select id="step-product" data-testid="order-product" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Choose…</option>
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.price}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="step-qty">Quantity</label>
        <input id="step-qty" data-testid="order-qty" type="number" min={1} max={99} value={qty} onChange={(e) => setQty(e.target.value)} />
      </div>
      <button type="button" className="btn" data-testid="order-place" onClick={place} disabled={!productId}>
        Place order
      </button>
      {order && (
        <p className="status-region ok" data-testid="order-summary" style={{ marginTop: '0.9rem' }}>
          {order.id}: {order.name} × {order.qty} — total {order.total}
        </p>
      )}
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'steps-attachments',
  track: 'expert',
  title: 'Steps, Attachments & Tracing',
  summary: 'Structure tests into named steps, attach payloads and confirmations to reports, and cut standalone traces.',
  concepts: ['test.step()', 'testInfo.attach', 'context.tracing', 'readable traces'],
  task: TASK,
  hints: [
    'test.step("name", async () => { ... }) can return a value — use it to build structured payloads mid-test. Steps nest and show up as a tree in traces and the HTML report.',
    'Attachments: testInfo.attach("order-payload.json", { body: JSON.stringify(data, null, 2), contentType: "application/json" }). The testInfo fixture is the second test argument: test("...", async ({ page }, testInfo) => {...}).',
    'Standalone trace: await context.tracing.start({ screenshots: true, snapshots: true }); … await context.tracing.stop({ path: testInfo.outputPath("trace.zip") }); then npx playwright show-trace trace.zip.',
    'Keep step names outcome-oriented ("configure the order") rather than action-oriented ("click button") — future readers care about intent.',
  ],
  solution: `test('place an order with named steps and attachments', async ({ page }, testInfo) => {
  await test.step('open the order form', async () => {
    await page.goto('/expert/steps-attachments');
  });

  const payload = await test.step('configure the order', async () => {
    await page.getByLabel('Product').selectOption('p-2');
    await page.getByLabel('Quantity').fill('2');
    const data = { productId: 'p-2', quantity: 2 };
    await testInfo.attach('order-payload.json', {
      body: JSON.stringify(data, null, 2),
      contentType: 'application/json',
    });
    return data;
  });

  await test.step('place the order', async () => {
    await page.getByTestId('order-place').click();
    await expect(page.getByTestId('order-summary')).toContainText('Assertion Owl × 2');
  });

  await testInfo.attach('confirmation.txt', {
    body: (await page.getByTestId('order-summary').textContent()) ?? '',
    contentType: 'text/plain',
  });

  expect(payload).toEqual({ productId: 'p-2', quantity: 2 });
});`,
  example: 'examples/expert/steps-attachments.spec.ts',
  path: '/expert/steps-attachments',
};
