import { test, expect } from '@playwright/test';

test.describe('Real World · Analytics & Tracking Verification', () => {
  test('purchase fires the right analytics, three ways', async ({ page }) => {
    // 1) harvest in Node via a binding (registered BEFORE goto)
    const collected: { event: string; props: Record<string, unknown> }[] = [];
    await page.exposeBinding('__onTrack', (_source, event) => {
      collected.push(event as { event: string; props: Record<string, unknown> });
    });

    // 2) spy on the network beacons
    const beacons: { event: string; props: Record<string, unknown> }[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/analytics')) {
        beacons.push(req.postDataJSON());
      }
    });

    await page.goto('/real-world/analytics');
    await page.getByTestId('track-add').click();
    await page.getByTestId('track-purchase').click();

    // UI, network and binding must all agree on the event count
    await expect(page.getByTestId('analytics-count')).toHaveText('3');
    await expect
      .poll(() => beacons.filter((b) => b.event === 'purchase_completed').length)
      .toBe(1);
    expect(collected.map((e) => e.event)).toEqual(
      expect.arrayContaining(['product_viewed', 'item_added', 'purchase_completed']),
    );

    const purchase = beacons.find((b) => b.event === 'purchase_completed');
    expect(purchase?.props).toMatchObject({ orderId: 'ORD-7731', total: 71.42, currency: 'USD' });
  });

  test('the server-side collector received the same events', async ({ page, request }) => {
    await page.goto('/real-world/analytics');
    await page.getByTestId('track-purchase').click();
    await expect(page.getByTestId('analytics-count')).toHaveText('2');

    const res = await request.get('/api/analytics');
    const events = (await res.json()).events as { event: string }[];
    const names = events.map((e) => e.event);
    expect(names).toContain('product_viewed');
    expect(names).toContain('purchase_completed');
  });
});
