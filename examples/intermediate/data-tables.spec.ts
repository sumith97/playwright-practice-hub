import { test, expect } from '@playwright/test';

test.describe('Intermediate · Data Tables', () => {
  test('renders the first page', async ({ page }) => {
    await page.goto('/intermediate/data-tables');
    const table = page.getByTestId('employee-table');
    await expect(table.getByRole('row')).toHaveCount(6); // header + 5 rows
    await expect(page.getByTestId('page-indicator')).toHaveText('Page 1 of 3');
  });

  test('sorting flips direction and reorders rows', async ({ page }) => {
    await page.goto('/intermediate/data-tables');
    const table = page.getByTestId('employee-table');

    await page.getByTestId('sort-salary').click();
    await expect(page.getByTestId('sort-salary')).toHaveAttribute('aria-sort', 'ascending');
    await expect(table.getByRole('row').nth(1)).toContainText('Mallory Kernel'); // salary $1

    await page.getByTestId('sort-salary').click();
    await expect(page.getByTestId('sort-salary')).toHaveAttribute('aria-sort', 'descending');
    await expect(table.getByRole('row').nth(1)).toContainText('Marie Curie'); // salary $155k
  });

  test('filtering narrows the table', async ({ page }) => {
    await page.goto('/intermediate/data-tables');
    await page.getByTestId('table-filter').fill('Portland');
    await expect(page.getByTestId('employee-table').getByRole('row')).toHaveCount(3); // header + 2
    await expect(page.getByTestId('row-count')).toContainText('Showing 2 of 2');

    await page.getByTestId('table-filter').fill('zzz-no-match');
    await expect(page.getByTestId('employee-table')).toContainText('No rows match your filter.');
    await expect(page.getByTestId('row-count')).toContainText('Showing 0 of 0');
  });

  test('pagination navigates pages', async ({ page }) => {
    await page.goto('/intermediate/data-tables');
    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-indicator')).toHaveText('Page 2 of 3');
    await expect(page.getByTestId('prev-page')).toBeEnabled();
    await page.getByTestId('prev-page').click();
    await expect(page.getByTestId('page-indicator')).toHaveText('Page 1 of 3');
    await expect(page.getByTestId('prev-page')).toBeDisabled();
  });

  test('row-scoped delete removes exactly one employee', async ({ page }) => {
    await page.goto('/intermediate/data-tables');
    // Mallory sits deep in the default (name-sorted) pagination — filter first
    await page.getByTestId('table-filter').fill('Mallory');
    await expect(page.getByTestId('employee-table').getByRole('row')).toHaveCount(2);

    await page
      .getByRole('row', { name: /Mallory Kernel/ })
      .getByRole('button', { name: 'Delete Mallory Kernel' })
      .click();

    await expect(page.getByTestId('employee-table')).toContainText('No rows match your filter.');
    await page.getByTestId('table-filter').fill('');
    await expect(page.getByTestId('employee-table')).not.toContainText('Mallory Kernel');
    await expect(page.getByTestId('row-count')).toContainText('total 13');
  });
});
