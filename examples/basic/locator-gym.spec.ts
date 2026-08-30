import { test, expect } from '@playwright/test';

test.describe('Basic · Locator Gym', () => {
  test('exercise every locator strategy', async ({ page }) => {
    await page.goto('/basics/locator-gym');

    await page.getByLabel('Username').focus();
    await page.getByPlaceholder('you@example.com').focus();
    await page.getByRole('button', { name: 'Sign up' }).click();
    await page.getByRole('link', { name: 'Read the docs' }).click();
    await page.getByTestId('launch-badge').click();
    await page.locator('.target-box').click();

    // strict-mode trap: two identical "Submit" buttons — scope to the billing form
    await page.getByRole('form', { name: 'Billing form' }).getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByTestId('strict-result')).toContainText('BILLING');

    // id/XPath territory
    await page.locator('#xpath-only-target').click();

    await expect(page.getByTestId('locator-checklist').locator('li.done')).toHaveCount(8);
  });
});
