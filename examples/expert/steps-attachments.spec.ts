import { test, expect } from '@playwright/test';

// the standalone-trace test below starts its own tracing; the runner-level
// auto-trace would conflict ("Tracing has been already started")
test.use({ trace: 'off' });

test.describe('Expert · Steps, Attachments & Tracing', () => {
  test('place an order with named steps and attachments', async ({ page }, testInfo) => {
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

    await test.step('attach the confirmation', async () => {
      await testInfo.attach('confirmation.txt', {
        body: (await page.getByTestId('order-summary').textContent()) ?? '',
        contentType: 'text/plain',
      });
    });

    expect(payload).toEqual({ productId: 'p-2', quantity: 2 });
  });

  test('a standalone trace independent of the config-level setting', async ({ browser }, testInfo) => {
    const context = await browser.newContext();
    await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
    const page = await context.newPage();

    await page.goto('/expert/steps-attachments');
    await page.getByLabel('Product').selectOption('p-1');
    await page.getByLabel('Quantity').fill('3');
    await page.getByTestId('order-place').click();
    await expect(page.getByTestId('order-summary')).toContainText('Locator Lens × 3');

    const tracePath = testInfo.outputPath('standalone-trace.zip');
    await context.tracing.stop({ path: tracePath });
    await context.close();

    // view it with: npx playwright show-trace <path>
    expect(tracePath).toBeTruthy();
  });
});
