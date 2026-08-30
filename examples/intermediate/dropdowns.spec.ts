import { test, expect } from '@playwright/test';

test.describe('Intermediate · Dropdowns & Typeahead', () => {
  test('native single select', async ({ page }) => {
    await page.goto('/intermediate/dropdowns');
    await page.getByLabel('Country').selectOption({ label: 'Japan' });
    await expect(page.getByTestId('country-result')).toHaveText('Japan');
  });

  test('native multi select', async ({ page }) => {
    await page.goto('/intermediate/dropdowns');
    await page.getByLabel('Toppings').selectOption(['Mushrooms', 'Olives']);
    await expect(page.getByTestId('toppings-result')).toHaveText('Mushrooms, Olives');
  });

  test('custom div-based dropdown with listbox semantics', async ({ page }) => {
    await page.goto('/intermediate/dropdowns');
    const trigger = page.getByTestId('framework-dropdown');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const listbox = page.getByRole('listbox', { name: 'Framework options' });
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: 'Playwright' }).click();

    await expect(trigger).toContainText('Framework: Playwright');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('debounced typeahead suggestions', async ({ page }) => {
    await page.goto('/intermediate/dropdowns');
    const input = page.getByTestId('typeahead-input');
    await input.pressSequentially('plan', { delay: 80 });

    const suggestions = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(suggestions.getByRole('option')).toHaveCount(5, { timeout: 5_000 });

    await suggestions.getByRole('option', { name: 'Planet Express' }).click();
    await expect(page.getByTestId('typeahead-result')).toHaveText('Planet Express');
  });
});
