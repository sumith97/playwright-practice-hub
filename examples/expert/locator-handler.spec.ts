import { test, expect } from '@playwright/test';

test.describe('Expert · Overlay Clinic (addLocatorHandler)', () => {
  test('auto-dismiss the promo overlay whenever it blocks an action', async ({ page }) => {
    await page.goto('/expert/locator-handler');

    // one registration before acting: whenever the overlay intercepts an
    // action's actionability check, dismiss it and let Playwright retry
    await page.addLocatorHandler(page.getByTestId('promo-overlay'), async (overlay) => {
      await overlay.getByTestId('promo-close').click();
    });

    for (const id of ['p-1', 'p-2', 'p-3', 'p-4']) {
      await page.getByTestId(`expert-add-${id}`).click();
    }

    await expect(page.getByTestId('expert-cart-count')).toHaveText('4');
    await expect(page.getByTestId('promo-dismissed-count')).not.toHaveText('0');
  });

  test('without a handler the overlay blocks clicks (control experiment)', async ({ page }) => {
    await page.goto('/expert/locator-handler');
    // let the first popup appear; nothing will ever dismiss it
    await expect(page.getByTestId('promo-overlay')).toBeVisible();

    await page.getByTestId('expert-add-p-1').click({ timeout: 2_000 }).catch(() => undefined);

    // the click never went through — this is the flake addLocatorHandler removes
    await expect(page.getByTestId('expert-cart-count')).toHaveText('0');
  });
});
