import { test, expect } from '@playwright/test';

test.describe('Advanced · WebSockets & SSE', () => {
  test('chat round-trips a message through the socket', async ({ page }) => {
    await page.goto('/advanced/realtime');
    await expect(page.getByTestId('chat-status')).toHaveText('connected');

    await page.getByTestId('chat-nick').fill('ada');
    await page.getByTestId('chat-input').fill('hello realtime world');
    await page.getByTestId('chat-send').click();

    const log = page.getByTestId('chat-log');
    await expect(log).toContainText('ada: hello realtime world');
    await expect(log).toContainText('Welcome to the practice chat');
  });

  test('framereceived exposes the raw socket traffic', async ({ page }) => {
    // attach to EVERY chat socket — StrictMode opens a throwaway one on boot,
    // and the dev server also runs an HMR socket we must ignore
    const received: any[] = [];
    page.on('websocket', (ws) => {
      if (!ws.url().includes('/ws/chat')) return;
      ws.on('framereceived', (frame) => {
        try {
          received.push(JSON.parse(frame.payload));
        } catch {
          // ignore non-JSON frames
        }
      });
    });

    await page.goto('/advanced/realtime');
    await expect(page.getByTestId('chat-status')).toHaveText('connected');

    await page.getByTestId('chat-input').fill('frame check');
    await page.getByTestId('chat-send').click();

    await expect
      .poll(() => received.some((m) => m?.text === 'frame check'), { timeout: 5_000 })
      .toBe(true);
  });

  test('SSE ticker streams updates', async ({ page }) => {
    await page.goto('/advanced/realtime');
    await expect
      .poll(async () => Number(await page.getByTestId('tick-count').textContent()), { timeout: 8_000 })
      .toBeGreaterThan(2);
    await expect(page.getByTestId('ticker-price')).toHaveText(/\$\d+\.\d{2}/);
  });
});
