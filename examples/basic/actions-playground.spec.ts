import { test, expect } from '@playwright/test';

test.describe('Basic · Actions Playground', () => {
  test('perform every interaction type', async ({ page }) => {
    await page.goto('/basics/actions-playground');

    const counter = page.getByTestId('click-counter');
    await counter.click();
    await counter.click();
    await counter.click();
    await expect(page.getByTestId('click-count')).toHaveText('3');

    await page.getByTestId('dblclick-target').dblclick();
    await expect(page.getByTestId('dblclick-count')).toHaveText('1');

    await page.getByTestId('context-zone').click({ button: 'right' });
    await expect(page.getByTestId('context-result')).toContainText('Custom menu');

    await page.getByTestId('tooltip-host').hover();
    await expect(page.getByTestId('tooltip')).toBeVisible();

    await page.getByTestId('keyboard-input').fill('sequence');
    await page.getByTestId('keyboard-input').press('Enter');
    await expect(page.getByTestId('last-key')).toContainText('Enter');

    await page.getByTestId('subscribe-checkbox').check();
    await page.getByRole('radio', { name: 'PayPal' }).check();
    await expect(page.getByRole('radio', { name: 'PayPal' })).toBeChecked();

    await page.getByTestId('shipping-select').selectOption('express');

    await page.getByTestId('focus-watcher').focus();
    await expect(page.getByTestId('focus-state')).toHaveText('focused');
    await page.getByTestId('focus-watcher').blur();
    await expect(page.getByTestId('focus-state')).toHaveText('blurred');

    await expect(page.getByTestId('actions-status')).toBeVisible();
  });
});
