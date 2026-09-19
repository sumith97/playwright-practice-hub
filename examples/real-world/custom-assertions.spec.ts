import { test, expect } from '@playwright/test';

expect.extend({
  toBeMoney(received: string) {
    const pass = /^\$\d+\.\d{2}$/.test(received);
    return {
      pass,
      message: () => `expected "${received}" ${pass ? 'not ' : ''}to be formatted money like $12.34`,
    };
  },
  toBeOrderRef(received: string) {
    const pass = /^INV-\d{6}$/.test(received);
    return {
      pass,
      message: () => `expected "${received}" ${pass ? 'not ' : ''}to match the INV-###### order reference format`,
    };
  },
});

const money = (s: string) => Number(s.replace(/[^0-9.]/g, ''));

test.describe('Real World · Custom Matchers & Soft Assertions', () => {
  test('the invoice follows the business rules', async ({ page }) => {
    await page.goto('/real-world/custom-assertions');

    // soft: collect EVERY mismatch in a single run
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
    expect(subtotal).toBe(61.5);
    expect(total).toBeCloseTo(subtotal + tax + shipping, 2);

    // the invariant survives a state change — that is the point of invariants
    await page.getByTestId('inv-free-shipping').click();
    await expect(page.getByTestId('inv-shipping')).toHaveText('$0.00');
    expect(money(await page.getByTestId('inv-total').textContent())).toBeCloseTo(subtotal + tax, 2);

    // and survives switching back
    await page.getByTestId('inv-free-shipping').click();
    expect(money(await page.getByTestId('inv-total').textContent())).toBeCloseTo(
      subtotal + tax + shipping,
      2,
    );
  });

  test('custom matchers also reject malformed values', () => {
    expect('71.42').not.toBeMoney(); // missing currency symbol
    expect('$71.421').not.toBeMoney(); // three decimals
    expect('ORD-7731').not.toBeOrderRef(); // wrong prefix
    expect('INV-842136').toBeOrderRef();
  });
});
