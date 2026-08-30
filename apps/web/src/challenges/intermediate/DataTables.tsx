import { useMemo, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Master the classic table operations:

1. Sort by each column by clicking its header — the arrow (▲/▼) and aria-sort attribute flip.
2. Filter the table with the search box (matches any column).
3. Paginate: 5 rows per page. Move to page 2 and back.
4. Delete the row for "Mallory Kernel" using its row-scoped delete button.
5. Assert the "Showing X of Y" counter is consistent after each operation.`;

interface Employee {
  name: string;
  role: string;
  office: string;
  salary: number;
}

const EMPLOYEES: Employee[] = [
  { name: 'Ada Byron', role: 'QA Lead', office: 'London', salary: 92000 },
  { name: 'Grace Hopper', role: 'Principal Engineer', office: 'Arlington', salary: 148000 },
  { name: 'Mallory Kernel', role: 'Flaky Test', office: 'Chaos City', salary: 1 },
  { name: 'Kent Beck', role: 'Coach', office: 'Portland', salary: 120000 },
  { name: 'Hedy Lamarr', role: 'Inventor', office: 'Vienna', salary: 133000 },
  { name: 'Alan Turing', role: 'Cryptanalyst', office: 'Bletchley', salary: 105000 },
  { name: 'Katherine Johnson', role: 'Mathematician', office: 'Hampton', salary: 118000 },
  { name: 'Linus Torvalds', role: 'Kernel Keeper', office: 'Portland', salary: 131000 },
  { name: 'Margaret Hamilton', role: 'Apollo Lead', office: 'Boston', salary: 140000 },
  { name: 'Radia Perlman', role: 'Network Mother', office: 'Seattle', salary: 127000 },
  { name: 'Barbara Liskov', role: 'Abstractionist', office: 'Boston', salary: 122000 },
  { name: 'Anita Borg', role: 'Community Builder', office: 'Palo Alto', salary: 115000 },
  { name: 'Douglas Adams', role: 'Towel Carrier', office: 'Islington', salary: 42000 },
  { name: 'Marie Curie', role: 'Double Nobel', office: 'Paris', salary: 155000 },
];

const PAGE_SIZE = 5;
type SortKey = 'name' | 'role' | 'office' | 'salary';
type SortDir = 'asc' | 'desc';

export default function DataTables() {
  const [rows, setRows] = useState(EMPLOYEES);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const matching = q
      ? rows.filter((r) => [r.name, r.role, r.office, String(r.salary)].some((v) => v.toLowerCase().includes(q)))
      : rows;
    const sorted = [...matching].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [rows, filter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const sortBy = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const arrow = (key: SortKey) => (key === sortKey ? (sortDir === 'asc' ? '▲' : '▼') : '');

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="table-filter">Search</label>
          <input
            id="table-filter"
            type="search"
            data-testid="table-filter"
            placeholder="Filter rows…"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <p className="small muted" data-testid="row-count">
          Showing {pageRows.length} of {filtered.length} (total {rows.length})
        </p>
      </div>

      <table className="data" data-testid="employee-table">
        <thead>
          <tr>
            {(['name', 'role', 'office', 'salary'] as SortKey[]).map((key) => (
              <th
                key={key}
                data-testid={`sort-${key}`}
                aria-sort={key === sortKey ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                onClick={() => sortBy(key)}
              >
                {key[0].toUpperCase() + key.slice(1)} {arrow(key)}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.role}</td>
              <td>{row.office}</td>
              <td data-testid={`salary-${row.name.split(' ')[0].toLowerCase()}`}>${row.salary.toLocaleString('en-US')}</td>
              <td>
                <button
                  type="button"
                  className="btn danger subtle"
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                  aria-label={`Delete ${row.name}`}
                  onClick={() => setRows((prev) => prev.filter((r) => r.name !== row.name))}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {pageRows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                No rows match your filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.8rem' }}>
        <button type="button" className="btn subtle" data-testid="prev-page" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
          ← Previous
        </button>
        <span data-testid="page-indicator">
          Page {safePage} of {pageCount}
        </span>
        <button
          type="button"
          className="btn subtle"
          data-testid="next-page"
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={safePage === pageCount}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'data-tables',
  track: 'intermediate',
  title: 'Data Tables',
  summary: 'Sorting, filtering, pagination and row-scoped actions on a realistic data table.',
  concepts: ['row-scoped locators', 'filter()', 'aria-sort', 'pagination', 'toHaveCount'],
  task: TASK,
  hints: [
    'Row scoping is the key skill: page.getByRole("row", { name: /Mallory Kernel/ }).getByRole("button").click() acts on exactly that row.',
    'Sorting state is exposed via aria-sort on headers: expect(page.getByTestId("sort-salary")).toHaveAttribute("aria-sort", "descending") after two clicks.',
    'Filter then assert the row count: await page.getByTestId("table-filter").fill("Portland"); expect(rows).toHaveCount(2).',
  ],
  solution: `test('table gymnastics', async ({ page }) => {
  const table = page.getByTestId('employee-table');
  await page.goto('/intermediate/data-tables');
  await expect(table.getByRole('row')).toHaveCount(6); // 5 rows + header

  // sorting
  await page.getByTestId('sort-salary').click();
  await expect(page.getByTestId('sort-salary')).toHaveAttribute('aria-sort', 'ascending');
  await expect(table.getByRole('row').nth(1)).toContainText('Mallory Kernel');
  await page.getByTestId('sort-salary').click();
  await expect(page.getByTestId('sort-salary')).toHaveAttribute('aria-sort', 'descending');

  // filtering
  await page.getByTestId('table-filter').fill('Portland');
  await expect(table.getByRole('row')).toHaveCount(3); // 2 rows + header
  await page.getByTestId('table-filter').fill('');

  // pagination
  await page.getByTestId('next-page').click();
  await expect(page.getByTestId('page-indicator')).toHaveText('Page 2 of 3');
  await page.getByTestId('prev-page').click();

  // row-scoped delete
  await page.getByRole('row', { name: /Mallory Kernel/ }).getByRole('button', { name: 'Delete Mallory Kernel' }).click();
  await expect(page.getByTestId('row-count')).toContainText('total 13');
});`,
  example: 'examples/intermediate/data-tables.spec.ts',
  path: '/intermediate/data-tables',
};
