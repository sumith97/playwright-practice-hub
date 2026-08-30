import { test, expect, type Dialog } from '@playwright/test';

test.describe('Intermediate · Dialogs', () => {
  test('one handler per dialog: accept, answer, dismiss', async ({ page }) => {
    await page.goto('/intermediate/dialogs');
    const handled: string[] = [];

    const onceDialog = (run: (d: Dialog) => Promise<void>) =>
      new Promise<void>((resolve) => page.once('dialog', (d) => { handled.push(d.type()); resolve(run(d)); }));

    const alertHandled = onceDialog((d) => d.accept());
    await page.getByTestId('alert-button').click();
    await alertHandled;

    const confirmHandled = onceDialog((d) => d.accept());
    await page.getByTestId('confirm-button').click();
    await confirmHandled;
    await expect(page.getByTestId('dialog-log')).toContainText('confirmation accepted');

    const promptHandled = onceDialog((d) => d.accept('getByRole'));
    await page.getByTestId('prompt-button').click();
    await promptHandled;
    await expect(page.getByTestId('dialog-log')).toContainText('prompt answered: "getByRole"');

    const dismissHandled = onceDialog((d) => d.dismiss());
    await page.getByTestId('confirm-button').click();
    await dismissHandled;
    await expect(page.getByTestId('dialog-log')).toContainText('confirmation dismissed');

    expect(handled).toEqual(['alert', 'confirm', 'prompt', 'confirm']);
  });

  test('beforeunload guard blocks navigation until accepted', async ({ page }) => {
    await page.goto('/intermediate/dialogs');
    await page.getByTestId('nav-guard').check();

    // dismissing keeps us on the page
    const dismissHandled = new Promise<void>((resolve) => page.once('dialog', (d) => resolve(d.dismiss())));
    await page.getByTestId('leave-page').click();
    await dismissHandled;
    await expect(page).toHaveURL(/\/intermediate\/dialogs/);

    // accepting lets the navigation through
    const acceptHandled = new Promise<void>((resolve) => page.once('dialog', (d) => resolve(d.accept())));
    await page.getByTestId('leave-page').click();
    await acceptHandled;
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('custom modal is ordinary DOM', async ({ page }) => {
    await page.goto('/intermediate/dialogs');
    await page.getByTestId('open-modal').click();

    const modal = page.getByRole('dialog', { name: 'Confirm deletion' });
    await expect(modal).toBeVisible();
    await page.getByTestId('modal-cancel').click();
    await expect(modal).toBeHidden();
    await expect(page.getByTestId('modal-result')).toHaveText('Modal: cancelled');
  });
});
