import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { WebSocketServer, type WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { registerRoutes } from './routes.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = Fastify({ logger: false });

await app.register(cors, { origin: true });
await app.register(jwt, { secret: 'playwright-practice-hub-secret' });
await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

// Make request.user typed as the JWT payload everywhere.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { email: string; name: string; role: 'user' | 'admin' };
    user: { email: string; name: string; role: 'user' | 'admin' };
  }
}

registerRoutes(app);

// ---- WebSocket chat (/ws/chat) ---------------------------------------------
const chatWss = new WebSocketServer({ noServer: true });
type ChatMessage = { type: 'system' | 'message'; user?: string; text: string; ts: number };
const chatHistory: ChatMessage[] = [];

function broadcast(message: ChatMessage): void {
  chatHistory.push(message);
  if (chatHistory.length > 50) chatHistory.shift();
  const payload = JSON.stringify(message);
  for (const client of chatWss.clients) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
}

chatWss.on('connection', (socket: WebSocket) => {
  socket.send(JSON.stringify({ type: 'system', text: 'Welcome to the practice chat. Messages are echoed to everyone.', ts: Date.now() }));
  socket.on('message', (raw: unknown) => {
    let user = 'anon';
    let text = String(raw);
    try {
      const parsed = JSON.parse(String(raw)) as { user?: string; text?: string };
      if (parsed.user) user = parsed.user;
      if (parsed.text) text = parsed.text;
    } catch {
      // treat payload as plain text
    }
    broadcast({ type: 'message', user, text, ts: Date.now() });
  });
});

app.server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  if (pathname === '/ws/chat') {
    chatWss.handleUpgrade(request, socket, head, (ws) => chatWss.emit('connection', ws, request));
  } else {
    socket.destroy();
  }
});

// ---- SSE ticker (/sse/ticker) ------------------------------------------------
app.get('/sse/ticker', async (request, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  reply.raw.write('retry: 2000\n\n');
  let price = 100 + Math.random() * 10;
  const interval = setInterval(() => {
    price = Math.max(1, price + (Math.random() - 0.5) * 2);
    reply.raw.write(`data: ${JSON.stringify({ symbol: 'PWL', price: Number(price.toFixed(2)), ts: Date.now() })}\n\n`);
  }, 1000);
  request.raw.on('close', () => clearInterval(interval));
  // Keep the response open; returning nothing.
  await new Promise(() => {});
});

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: PORT, host: '127.0.0.1' });
    console.log(`Practice API ready on http://127.0.0.1:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
