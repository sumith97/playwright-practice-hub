import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `A thousand tests deserve their own assertion vocabulary. Build custom matchers:

1. The invoice below has a strict shape: money strings ($71.42), an order reference (INV-842136), and a math invariant (subtotal + tax + shipping = total).
2. Extend expect with your own matchers — toBeMoney(), toBeOrderRef(), toBeTotalOf() — so the suite reads like a business rule instead of regex soup.
3. Practice expect.soft: validate EVERY line of the invoice in one test, collecting all mismatches instead of stopping at the first.
4. Apply the matchers to both the rendered values and values you compute yourself.`;

const INVOICE = {
  id: 'INV-842136',
  items: [
    { name: 'Locator Lens', qty: 1, price: 12.0 },
    { name: 'Assertion Owl', qty: 2, price: 24.5 },
  ],
  subtotal: 61.5,
  taxRate: 0.08,
  shipping: 5.0,
};

export default function CustomAssertions() {
  const [bumped, setBumped] = useState(false);
  const tax = INVOICE.subtotal * INVOICE.taxRate;
  const shipping = bumped ? 0 : INVOICE.shipping; // free shipping toggle — assert the invariant still holds
  const total = INVOICE.subtotal + tax + shipping;

  const money = (v: number) => `$${v.toFixed(2)}`;

  return (
    <div className="card">
      <h3>Invoice {INVOICE.id}</h3>
      <table className="data" data-testid="invoice-table" style={{ margin: '0.8rem 0' }}>
        <tbody>
          {INVOICE.items.map((item) => (
            <tr key={item.name}>
              <td>
                {item.name} × {item.qty}
              </td>
              <td className="price">{money(item.price * item.qty)}</td>
            </tr>
          ))}
          <tr>
            <td>Subtotal</td>
            <td className="price" data-testid="inv-subtotal">
              {money(INVOICE.subtotal)}
            </td>
          </tr>
          <tr>
            <td>Tax (8%)</td>
            <td className="price" data-testid="inv-tax">
              {money(tax)}
            </td>
          </tr>
          <tr>
            <td>Shipping</td>
            <td className="price" data-testid="inv-shipping">
              {money(shipping)}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Total</strong>
            </td>
            <td>
              <strong className="price" data-testid="inv-total">
                {money(total)}
              </strong>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="small muted">
        Invoice reference: <code data-testid="inv-id">{INVOICE.id}</code>
      </p>
      <button type="button" className="btn subtle" data-testid="inv-free-shipping" onClick={() => setBumped((v) => !v)}>
        {bumped ? 'Restore shipping cost' : 'Apply free shipping'}
      </button>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'custom-assertions',
  track: 'real-world',
  title: 'Custom Matchers & Soft Assertions',
  summary: 'expect.extend: give your suite a business-language assertion vocabulary, and collect every mismatch with expect.soft.',
  concepts: ['expect.extend', 'custom matchers', 'expect.soft', 'assertion design'],
  task: TASK,
  hints: [
    'expect.extend({ toBeMoney(received) { const pass = /^\\$\\d+\\.\\d{2}$/.test(received); return { pass, message: () => \`expected "\${received}" \${pass ? "not " : ""}to be money like $12.34\` }; } }) — register once per spec file (or in a shared matcher module).',
    'Matchers with arguments: toBeCloseToMoney(received, expected, tolerance = 0.01). Use this.isNot inside message() for correct negated phrasing.',
    'expect.soft keeps running after a failure: every soft mismatch is reported at the END of the test — perfect for invoices where you want to see all wrong lines at once. One hard assertion at the end still guards the invariant.',
    'Parse the rendered strings back to numbers (Number(text.replace(/[^\\d.]/g, ""))) before doing math — never assert money math on strings.',
  ],
  solution: `expect.extend({
  toBeMoney(received: string) {
    const pass = /^\\$\\d+\\.\\d{2}$/.test(received);
    return {
      pass,
      message: () => 'expected ' + received + (pass ? ' not' : '') + ' to be formatted money like $12.34',
    };
  },
  toBeOrderRef(received: string) {
    const pass = /^INV-\\d{6}$/.test(received);
    return { pass, message: () => 'expected ' + received + (pass ? ' not' : '') + ' to match INV-######' };
  },
});

const money = (s: string) => Number(s.replace(/[^\\d.]/g, ''));

test('invoice follows the business rules', async ({ page }) => {
  await page.goto('/real-world/custom-assertions');

  // soft: collect EVERY mismatch in one run
  expect.soft(await page.getByTestId('inv-id').textContent()).toBeOrderRef();
  expect.soft(await page.getByTestId('inv-subtotal').textContent()).toBeMoney();
  expect.soft(await page.getByTestId('inv-tax').textContent()).toBeMoney();
  expect.soft(await page.getByTestId('inv-shipping').textContent()).toBeMoney();
  expect.soft(await page.getByTestId('inv-total').textContent()).toBeMoney();

  // hard: the math invariant must hold exactly
  const subtotal = money(await page.getByTestId('inv-subtotal').textContent());
  const tax = money(await page.getByTestId('inv-tax').textContent());
  const shipping = money(await page.getByTestId('inv-shipping').textContent());
  const total = money(await page.getByTestId('inv-total').textContent());
  expect(total).toBeCloseTo(subtotal + tax + shipping, 2);

  // the invariant survives a state change — that is the point of invariants
  await page.getByTestId('inv-free-shipping').click();
  expect(money(await page.getByTestId('inv-total').textContent()))
    .toBeCloseTo(subtotal + tax, 2);
});`,
  example: 'examples/real-world/custom-assertions.spec.ts',
  path: '/real-world/custom-assertions',
};
