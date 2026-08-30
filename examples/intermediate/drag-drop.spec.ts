import { test, expect } from '@playwright/test';

test.describe('Intermediate · Drag & Drop', () => {
  test('HTML5 drag and drop onto the pizza zone', async ({ page }) => {
    await page.goto('/intermediate/drag-drop');
    await page.getByTestId('ingredient-mozzarella').dragTo(page.getByTestId('pizza-zone'));
    await expect(page.getByTestId('pizza-zone')).toContainText('Mozzarella');

    await page.getByTestId('ingredient-basil').dragTo(page.getByTestId('pizza-zone'));
    await expect(page.getByTestId('pizza-zone')).toHaveText(/Mozzarella \+ Basil leaves/);
  });

  test('reorder pipeline with buttons', async ({ page }) => {
    await page.goto('/intermediate/drag-drop');
    await page.getByRole('button', { name: 'Move E2E tests up' }).click();
    await page.getByRole('button', { name: 'Move E2E tests up' }).click();
    await expect(page.getByTestId('pipeline-list').locator('li').first()).toContainText('E2E tests');
  });

  test('slider accepts fill and arrow keys', async ({ page }) => {
    await page.goto('/intermediate/drag-drop');
    await page.getByLabel('Difficulty').fill('75');
    await expect(page.getByTestId('slider-value')).toHaveText('75');

    await page.getByLabel('Difficulty').press('ArrowLeft');
    await expect(page.getByTestId('slider-value')).toHaveText('70');
  });

  test('freehand canvas drawing via raw mouse events', async ({ page }) => {
    await page.goto('/intermediate/drag-drop');
    const canvas = page.getByTestId('sketch-canvas');
    // raw page.mouse coordinates are viewport-relative — bring the canvas into view first
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + 20, box!.y + 80);
    await page.mouse.down();
    for (let i = 0; i <= 15; i++) {
      await page.mouse.move(box!.x + 20 + i * 12, box!.y + 80 + Math.sin(i / 3) * 25);
    }
    await page.mouse.up();

    await page.getByTestId('analyze-drawing').click();
    await expect(page.getByTestId('points-result')).toContainText(/points drawn/);
  });
});
