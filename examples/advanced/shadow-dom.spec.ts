import { test, expect } from '@playwright/test';

test.describe('Advanced · Shadow DOM', () => {
  test('regular locators pierce a single shadow root', async ({ page }) => {
    await page.goto('/advanced/shadow-dom');
    const widget = page.getByTestId('shadow-host');

    await widget.getByPlaceholder('outer-secret').fill('top-secret');
    await widget.getByRole('button', { name: 'Save outer value' }).click();

    await expect(widget.getByText('Saved: "top-secret"')).toBeVisible();
  });

  test('even nested shadow roots stay reachable', async ({ page }) => {
    await page.goto('/advanced/shadow-dom');
    const inner = page.getByTestId('nested-shadow-host').getByTestId('inner-host');

    await inner.getByPlaceholder('inner-secret').fill('deep-secret');
    await inner.getByRole('button', { name: 'Save nested value' }).click();

    await expect(inner.getByText('Nested saved: "deep-secret"')).toBeVisible();
  });
});
