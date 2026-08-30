import { test, expect } from '@playwright/test';

test.describe('Basic · Form Validation', () => {
  test('validates inline and enables submit only when valid', async ({ page }) => {
    await page.goto('/basics/form-validation');
    const submit = page.getByTestId('signup-submit');
    await expect(submit).toBeDisabled();

    await page.getByLabel('Full name').fill('A');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password', { exact: true }).fill('short');
    await expect(page.getByTestId('error-name')).toBeVisible();
    await expect(page.getByTestId('error-email')).toHaveText('Enter a valid email address');
    await expect(page.getByTestId('error-password')).toContainText('8+ characters');
    await expect(submit).toBeDisabled();

    await page.getByLabel('Full name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('ada@analytical.engine');
    await page.getByLabel('Password', { exact: true }).fill('en1gm4tic');
    await page.getByLabel('Confirm password').fill('en1gm4tic');
    await page.getByTestId('terms-checkbox').check();

    await expect(page.getByTestId('error-name')).toHaveCount(0);
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByTestId('signup-success')).toContainText('Welcome aboard, Ada Lovelace!');
  });

  test('mismatched confirmation is rejected', async ({ page }) => {
    await page.goto('/basics/form-validation');
    await page.getByLabel('Full name').fill('Grace Hopper');
    await page.getByLabel('Email').fill('grace@navy.mil');
    await page.getByLabel('Password', { exact: true }).fill('compil3r');
    await page.getByLabel('Confirm password').fill('compil3rX');
    await expect(page.getByTestId('error-confirm')).toHaveText('Passwords must match');
    await expect(page.getByTestId('signup-submit')).toBeDisabled();
  });
});
