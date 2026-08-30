import { test, expect } from '@playwright/test';

test.describe('Basic · First E2E Test', () => {
  test('login, verify dashboard, log out', async ({ page }) => {
    await page.goto('/basics/first-e2e');

    await page.getByLabel('Email').fill('student@hub.dev');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid credentials');

    await page.getByLabel('Password').fill('playwright-rocks');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByTestId('welcome-message')).toHaveText('Welcome back, Student!');
    await expect(page.getByTestId('activity-table').locator('tbody tr')).toHaveCount(3);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});
