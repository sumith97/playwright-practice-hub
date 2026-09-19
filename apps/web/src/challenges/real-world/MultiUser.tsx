import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `One test, TWO users. Real scenarios are rarely single-player:

1. Open TWO browser contexts in the same test (browser.newContext() twice). They are separate identities: separate cookies, separate localStorage AND sessionStorage.
2. Seed each context with a different nickname (sessionStorage key pph.support.nick via addInitScript) — agent-smith and customer-jones.
3. Both open this support desk and connect to the shared WebSocket room.
4. The customer asks about an order; the agent replies. Assert each message appears in the OTHER context's log — proving real-time cross-user delivery.
5. Prove isolation: each context still sees only its own nickname, never the other's.`;

interface Line {
  system?: boolean;
  user?: string;
  text: string;
}

/**
 * One chat socket per PAGE (not per component mount). React StrictMode mounts
 * effects twice in dev; closing/reopening the socket in cleanup races the WS
 * proxy handshake on some engines. A page-level singleton sidesteps that —
 * the same "shared connection manager" pattern real apps use.
 */
function getChatSocket(): WebSocket {
  const w = window as unknown as { __supportSocket?: WebSocket };
  if (!w.__supportSocket || w.__supportSocket.readyState >= WebSocket.CLOSING) {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    w.__supportSocket = new WebSocket(proto + '://' + location.host + '/ws/chat');
  }
  return w.__supportSocket;
}

export default function MultiUser() {
  const [nick, setNick] = useState(() => sessionStorage.getItem('pph.support.nick') ?? 'anon');
  const [draft, setDraft] = useState('');
  const [connected, setConnected] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const socket = getChatSocket();

    const onOpen = () => setConnected(true);
    const onClose = () => setConnected(false);
    const onMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(String(event.data)) as { type: string; user?: string; text: string };
        setLines((prev) => [...prev.slice(-30), { system: data.type === 'system', user: data.user, text: data.text }]);
      } catch {
        // ignore malformed frames
      }
    };

    if (socket.readyState === WebSocket.OPEN) onOpen();
    socket.addEventListener('open', onOpen);
    socket.addEventListener('close', onClose);
    socket.addEventListener('message', onMessage);

    return () => {
      // detach handlers but keep the shared socket alive (StrictMode-safe)
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('close', onClose);
      socket.removeEventListener('message', onMessage);
    };
  }, []);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    getChatSocket().send(JSON.stringify({ user: nick, text }));
    setDraft('');
  };

  return (
    <div className="card">
      <h3>
        Support desk{' '}
        <span className={`badge ${connected ? 'basic' : 'advanced'}`} data-testid="support-status" style={{ textTransform: 'none' }}>
          {connected ? 'connected' : 'connecting…'}
        </span>
      </h3>
      <p className="small muted">
        You are: <strong data-testid="support-identity">{nick}</strong>{' '}
        <span className="muted">(from sessionStorage — private to this browser context)</span>
      </p>
      <div className="field" style={{ maxWidth: 260 }}>
        <label htmlFor="support-nick">Nickname</label>
        <input
          id="support-nick"
          data-testid="support-nick"
          value={nick}
          onChange={(e) => {
            setNick(e.target.value);
            sessionStorage.setItem('pph.support.nick', e.target.value);
          }}
        />
      </div>

      <div className="chat-log" data-testid="support-log">
        {lines.length === 0 ? (
          <span className="muted small">No messages yet — open a second context and talk to yourself.</span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={`chat-line ${line.system ? 'system' : ''}`}>
              {line.system ? line.text : (
                <>
                  <span className="who">{line.user}:</span> {line.text}
                </>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
        <input
          data-testid="support-input"
          aria-label="Support message"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn" data-testid="support-send" disabled={!connected}>
          Send
        </button>
      </form>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'multi-user',
  track: 'real-world',
  title: 'Multi-User Contexts',
  summary: 'Two browser contexts in one test: isolated identities talking to each other over a live channel.',
  concepts: ['browser.newContext()', 'session isolation', 'addInitScript seeding', 'cross-context assertions'],
  task: TASK,
  hints: [
    'Each browser.newContext() is a clean identity: its own cookies, storage and pages. Two contexts in one test is the standard pattern for "user A does something user B sees".',
    'Seed the nickname before the page boots: await ctxA.addInitScript(() => sessionStorage.setItem("pph.support.nick", "agent-smith")); — init scripts run before any app code.',
    'Assert cross-delivery by checking the OTHER page object: await pageB.getByTestId("support-log").toContainText("agent-smith: Where is my order?"); — web-first assertions retry while the message travels.',
    'Prove isolation by reading storage back: await pageA.evaluate(() => sessionStorage.getItem("pph.support.nick")) — it must still be agent-smith on A and customer-jones on B.',
  ],
  solution: `test('agent and customer talk in two isolated contexts', async ({ browser }) => {
  const ctxA = await browser.newContext();
  await ctxA.addInitScript(() => sessionStorage.setItem('pph.support.nick', 'agent-smith'));
  const ctxB = await browser.newContext();
  await ctxB.addInitScript(() => sessionStorage.setItem('pph.support.nick', 'customer-jones'));

  const agent = await ctxA.newPage();
  const customer = await ctxB.newPage();
  await agent.goto('/real-world/multi-user');
  await customer.goto('/real-world/multi-user');

  await expect(agent.getByTestId('support-status')).toHaveText('connected');
  await expect(customer.getByTestId('support-status')).toHaveText('connected');
  await expect(agent.getByTestId('support-identity')).toHaveText('agent-smith');

  await customer.getByTestId('support-input').fill('Where is my order ORD-7731?');
  await customer.getByTestId('support-send').click();
  await expect(agent.getByTestId('support-log')).toContainText('customer-jones: Where is my order ORD-7731?');

  await agent.getByTestId('support-input').fill('Shipping today!');
  await agent.getByTestId('support-send').click();
  await expect(customer.getByTestId('support-log')).toContainText('agent-smith: Shipping today!');

  // storage isolation: each context keeps its own identity
  expect(await agent.evaluate(() => sessionStorage.getItem('pph.support.nick'))).toBe('agent-smith');
  expect(await customer.evaluate(() => sessionStorage.getItem('pph.support.nick'))).toBe('customer-jones');

  await ctxA.close();
  await ctxB.close();
});`,
  example: 'examples/real-world/multi-user.spec.ts',
  path: '/real-world/multi-user',
};
