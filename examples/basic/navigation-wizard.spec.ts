import { test, expect } from '@playwright/test';

test.describe('Basic · Navigation Wizard', () => {
  test('walk through the wizard with URL assertions', async ({ page }) => {
    await page.goto('/basics/navigation-wizard');
    await expect(page).toHaveURL(/\/basics\/navigation-wizard\/step\/1/);

    await page.getByLabel('Project name').fill('my-awesome-suite');
    await page.getByTestId('wizard-next').click();
    await expect(page).toHaveURL(/step\/2/);

    await page.getByLabel('Preferred framework').selectOption('playwright');
    await page.getByTestId('wizard-next').click();
    await expect(page).toHaveURL(/step\/3/);
    await expect(page.getByTestId('wizard-review')).toContainText('my-awesome-suite');

    await page.getByTestId('wizard-finish').click();
    await expect(page).toHaveURL(/\/complete/);
    await expect(page.getByTestId('wizard-complete')).toContainText('Wizard complete');

    // browser history back from the completion page
    await page.goBack();
    await expect(page).toHaveURL(/step\/3/);
    // in-app back button lives on the step pages
    await page.getByTestId('wizard-back').click();
    await expect(page).toHaveURL(/step\/2/);
  });

  test('slow redirect shows a spinner first', async ({ page }) => {
    await page.goto('/basics/navigation-wizard/step/1');
    await page.getByLabel('Project name').fill('redirect-practice');
    await page.getByTestId('wizard-next').click();
    await page.getByLabel('Preferred framework').selectOption('playwright');
    await page.getByTestId('wizard-next').click();
    await page.getByTestId('wizard-finish').click();
    await expect(page.getByTestId('wizard-complete')).toBeVisible();

    await page.getByTestId('wizard-slow-redirect').click();
    await expect(page.getByTestId('redirect-spinner')).toBeVisible();
    await page.waitForURL('**/basics/navigation-wizard/step/1');
    await expect(page).toHaveURL(/step\/1/);
    await expect(page.getByTestId('redirect-spinner')).toHaveCount(0);
  });

  test('continue stays disabled until the step is valid', async ({ page }) => {
    await page.goto('/basics/navigation-wizard/step/1');
    await expect(page.getByTestId('wizard-next')).toBeDisabled();
    await page.getByLabel('Project name').fill('gate');
    await expect(page.getByTestId('wizard-next')).toBeEnabled();
  });
});
