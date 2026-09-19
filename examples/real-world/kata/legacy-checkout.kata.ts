import { test, expect, type Page } from '@playwright/test';

/**
 * ⚠️ KATA STARTER — deliberately bad. This file is NEVER executed in CI
 * (it does not match the *.spec.ts testMatch). Copy it into your own suite as
 * legacy-checkout.spec.ts, run it a few times against /real-world/refactor-kata,
 * and refactor until it is fast, deterministic and readable.
 *
 * The smells, in order of appearance:
 *  1. Fixed sleeps everywhere (waitForTimeout) — slow AND flaky.
 *  2. Brittle absolute XPath with a GENERATED element id (changes every load).
 *  3. .first() on a table whose row order shuffles on every page load.
 *  4. A toast asserted AFTER a sleep — it may already be gone (it lives 2s).
 *  5. fire-and-forget click without waiting for the button to enable.
 *  6. Mixed concerns: one giant test with no structure, magic numbers, no isolation.
 */
test('legacy checkout works', async ({ page }: { page: Page }) => {
  await page.goto('/real-world/refactor-kata');

  // sleep "because the banner is slow" (smell #1)
  await page.waitForTimeout(1500);
  const banner = page.locator('[data-testid="legacy-banner"]');
  if (!(await banner.isVisible())) {
    throw new Error('banner missing'); // manual retry-by-exception (smell #1b)
  }

  // XPath + generated id that changes EVERY page load (smell #2)
  const legacyButton = page.locator('xpath=//button[starts-with(@id, "btn-")]');
  await legacyButton.click();
  await page.waitForTimeout(300);

  // rows shuffle on every load — .first() is a lottery (smell #3)
  const firstRow = page.locator('[data-testid="legacy-table"] tbody tr').first();
  await expect(firstRow).toBeVisible();

  // click pay immediately; it is still disabled for ~1.5s (smell #5)
  await page.locator('[data-testid="legacy-pay"]').click();
  await page.waitForTimeout(2500);

  // assert the toast AFTER sleeping — it may have already vanished (smell #4)
  await page.waitForTimeout(500);
  const toast = page.locator('[data-testid="legacy-toast"]');
  await expect(toast).toHaveText(/ORD-\d+/); // fails ~whenever timing shifts

  await page.waitForTimeout(1000); // "safety" sleep at the end (smell #1c)
  await expect(page.locator('[data-testid="legacy-status"]')).toHaveText('Done ✓');
});
