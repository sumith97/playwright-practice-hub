import { test, expect } from '@playwright/test';

/**
 * Every browser project runs this file against the SAME server, so slot ids
 * are prefixed with the project name — unique test data is the golden rule
 * of parallel-safe suites.
 */
const SLOTS = ['S-1', 'S-2', 'S-3', 'S-4', 'S-5', 'S-6', 'S-7', 'S-8', 'S-9', 'S-10', 'S-11', 'S-12'];

test.describe('Advanced · Parallelism & Control', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const slot of SLOTS) {
    test(`reserve ${slot} @smoke`, async ({ request }) => {
      const project = test.info().project.name;
      const res = await request.post(`/api/reserve/${project}-${slot}`);
      expect(res.status()).toBe(201);
      expect(await res.json()).toMatchObject({ id: `${project}-${slot}`, status: 'reserved' });
    });
  }

  test('second reservation of the same slot conflicts', async ({ request }) => {
    const id = `${test.info().project.name}-S-99`;

    const first = await request.post(`/api/reserve/${id}`);
    expect(first.status()).toBe(201);

    const second = await request.post(`/api/reserve/${id}`);
    expect(second.status()).toBe(409);
    expect((await second.json()).error).toContain('already reserved');
  });

  test('the reservation board reflects server state', async ({ page, request }) => {
    // first browser project to run gets 201; the others see 409 — both fine
    const reserved = await request.post('/api/reserve/S-3');
    expect([201, 409]).toContain(reserved.status());

    await page.goto('/advanced/parallelism');
    const res = await request.get('/api/reservations');
    expect((await res.json()).reserved).toContain('S-3');

    // the board shows every slot that is reserved server-side
    await expect(page.getByTestId('slot-S-3')).toHaveAttribute('data-state', 'reserved');
  });
});
