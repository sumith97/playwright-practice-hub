import { test, expect } from '@playwright/test';

test.describe('Intermediate · iFrames', () => {
  test('interact across frame boundaries and into a nested frame', async ({ page }) => {
    await page.goto('/intermediate/iframes');
    await page.getByTestId('load-frame').click();

    const frame = page.getByTestId('demo-frame').contentFrame();
    await frame.getByLabel('Your name').fill('Ada');
    await frame.getByRole('button', { name: 'Greet parent' }).click();

    await expect(page.getByTestId('greeting-region')).toHaveText('Hello Ada, from the inner frame!');

    // second-level frame nested inside the first
    const deep = frame.locator('#deep-frame').contentFrame();
    await deep.getByPlaceholder('deep-secret').fill('nested-value');
    await deep.getByRole('button', { name: 'Save deep value' }).click();
    await expect(deep.locator('#deep-status')).toHaveText('Deep frame saved: "nested-value"');
  });
});
