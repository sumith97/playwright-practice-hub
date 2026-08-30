import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Event-driven UI — two transports, two approaches:

1. The chat connects to a WebSocket (ws://…/ws/chat). Send a message; your message is echoed back with a timestamp. Assert the echo appears in the log.
2. System messages announce new connections — assert the welcome line.
3. Watch the SSE stock ticker below — it ticks roughly every second. Assert the price CHANGES and the update counter grows.
4. Deep dive: capture the socket in your test with page.waitForEvent("websocket"), then assert on frames (ws.on("framereceived")).`;

interface ChatLine {
  user?: string;
  text: string;
  system?: boolean;
}

export default function Realtime() {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [connected, setConnected] = useState(false);
  const [nick, setNick] = useState('tester');
  const [draft, setDraft] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  const [price, setPrice] = useState<number | null>(null);
  const [ticks, setTicks] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down' | 'flat'>('flat');

  const connect = () => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${proto}://${location.host}/ws/chat`);
    wsRef.current = socket;
    setConnected(false);
    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as { type: string; user?: string; text: string };
        setLines((prev) => [...prev.slice(-40), { user: data.type === 'system' ? undefined : data.user, text: data.text, system: data.type === 'system' }]);
      } catch {
        // ignore malformed frames
      }
    };
  };

  useEffect(() => {
    connect();
    const source = new EventSource('/sse/ticker');
    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as { price: number };
      setPrice((prev) => {
        if (prev !== null) setDirection(data.price > prev ? 'up' : data.price < prev ? 'down' : 'flat');
        return data.price;
      });
      setTicks((t) => t + 1);
    };
    return () => {
      source.close();
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    wsRef.current?.send(JSON.stringify({ user: nick, text }));
    setDraft('');
  };

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
      <div className="card" data-testid="chat-card">
        <h3>
          WebSocket chat{' '}
          <span className={`badge ${connected ? 'basic' : 'advanced'}`} data-testid="chat-status" style={{ textTransform: 'none' }}>
            {connected ? 'connected' : 'connecting…'}
          </span>
        </h3>
        <div className="chat-log" data-testid="chat-log">
          {lines.map((line, i) => (
            <div key={i} className={`chat-line ${line.system ? 'system' : ''}`}>
              {line.system ? line.text : (
                <>
                  <span className="who">{line.user}:</span> {line.text}
                </>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
          <label className="small" htmlFor="chat-nick" style={{ position: 'absolute', left: -9999 }}>
            Nickname
          </label>
          <input id="chat-nick" data-testid="chat-nick" value={nick} onChange={(e) => setNick(e.target.value)} style={{ width: 90 }} />
          <input
            data-testid="chat-input"
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ flex: 1 }}
            aria-label="Chat message"
          />
          <button type="submit" className="btn" data-testid="chat-send" disabled={!connected}>
            Send
          </button>
        </form>
      </div>

      <div className="card" data-testid="ticker-card">
        <h3>SSE stock ticker</h3>
        <p className="small muted">PWL Industries — streaming via Server-Sent Events</p>
        <p className={`ticker ${direction}`} data-testid="ticker-price">
          {price === null ? '…' : `$${price.toFixed(2)}`} <span aria-hidden="true">{direction === 'up' ? '▲' : direction === 'down' ? '▼' : ''}</span>
        </p>
        <p className="small muted">
          Ticks received: <strong data-testid="tick-count">{ticks}</strong>
        </p>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'realtime',
  track: 'advanced',
  title: 'WebSockets & SSE',
  summary: 'Assert against live chat over WebSockets and a streaming stock ticker over Server-Sent Events.',
  concepts: ['waitForEvent("websocket")', 'socket.on("framereceived")', 'EventSource streams', 'event-driven assertions'],
  task: TASK,
  hints: [
    'Simplest: interact with the UI (send a message) and assert the echo appears in chat-log. Playwright auto-retries until the message round-trips.',
    'Frame-level: const socketPromise = page.waitForEvent("websocket"); await page.goto(...); const socket = await socketPromise; socket.on("framereceived", (frame) => collect(JSON.parse(frame.payload)));',
    'The ticker updates every second — expect.poll on the tick-count test id to be greater than a baseline is a clean streaming assertion.',
  ],
  solution: `test('chat round-trip', async ({ page }) => {
  await page.goto('/advanced/realtime');
  await expect(page.getByTestId('chat-status')).toHaveText('connected');

  await page.getByTestId('chat-nick').fill('ada');
  await page.getByTestId('chat-input').fill('hello realtime world');
  await page.getByTestId('chat-send').click();

  await expect(page.getByTestId('chat-log')).toContainText('ada: hello realtime world');
  await expect(page.getByTestId('chat-log')).toContainText('Welcome to the practice chat');
});

test('inspect websocket frames', async ({ page }) => {
  const socketPromise = page.waitForEvent('websocket');
  await page.goto('/advanced/realtime');
  const socket = await socketPromise;

  const received: unknown[] = [];
  socket.on('framereceived', (frame) => {
    try { received.push(JSON.parse(frame.payload)); } catch { /* ignore */ }
  });

  await page.getByTestId('chat-input').fill('frame check');
  await page.getByTestId('chat-send').click();
  await expect.poll(() => received.some((m: any) => m?.text === 'frame check')).toBe(true);
});

test('ticker streams updates', async ({ page }) => {
  await page.goto('/advanced/realtime');
  await expect.poll(
    async () => Number(await page.getByTestId('tick-count').textContent()),
    { timeout: 8000 },
  ).toBeGreaterThan(2);
});`,
  example: 'examples/advanced/realtime.spec.ts',
  path: '/advanced/realtime',
};
