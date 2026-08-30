import { test, expect } from '@playwright/test';

test.describe('Advanced · A11y & ARIA Snapshots', () => {
  test('aria snapshot of the accessible card (file-based, committed)', async ({ page }) => {
    await page.goto('/advanced/a11y');
    // Baseline lives next to this spec as an .aria.yml file; review changes in PRs.
    await expect(page.locator('[aria-label="Newsletter signup"]')).toMatchAriaSnapshot();
  });

  test('the good card exposes proper roles and labels', async ({ page }) => {
    await page.goto('/advanced/a11y');
    // scope to the card — the global toast region also has role="status"
    const card = page.locator('[aria-label="Newsletter signup"]');

    const email = card.getByRole('textbox', { name: 'Email address' });
    await expect(email).toBeVisible();
    await email.fill('ada@example.com');

    await expect(card.getByRole('button', { name: 'Subscribe to newsletter' })).toBeEnabled();
    await expect(card.getByRole('status')).toBeAttached();
  });

  test('live region announces the subscription', async ({ page }) => {
    await page.goto('/advanced/a11y');
    await page.getByTestId('nl-submit').click();
    await expect(page.getByTestId('a11y-status')).toContainText('Thanks! Check your inbox');
  });

  test('axe-core flags the intentional violations', async ({ page }) => {
    await page.goto('/advanced/a11y');
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });

    const { violations } = await page.evaluate(() => (window as any).axe.run());
    const ids = violations.map((v: any) => v.id);

    // the alt-less image is a real violation…
    expect(ids).toContain('image-alt');
    // …but the "unlabeled" input is NOT: its placeholder computes an accessible
    // name, so axe's label rule passes. Placeholders are a weak substitute for
    // real labels — but axe can only check the name, not its quality.
    expect(ids).not.toContain('label');
  });

  test('the shady div is still clickable — but invisible to roles', async ({ page }) => {
    await page.goto('/advanced/a11y');

    // no accessible name -> role locator finds nothing, test id still works
    await expect(page.getByRole('button', { name: 'Clickable div' })).toHaveCount(0);
    await page.getByTestId('shady-button').click();
    await expect(page.getByTestId('shady-button')).toContainText('Clickable div');
  });
});
