import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch } from '../../lib/api';

const TASK = `This page is designed for parallel execution — every slot has a UNIQUE id:

1. Reserve a slot: POST /api/reserve/S-7 returns 201 and the slot turns green. Reserving it again (from another "worker") returns 409.
2. Write tests that reserve different slots in parallel (fullyParallel) — they never collide because ids differ.
3. Write one test that expects the 409 "already reserved" error path.
4. Scale out: parameterize over all 12 slots with a for-loop of tests, run with --workers=4, and watch sharding divide them in CI (--shard=1/2).
5. Tag smoke tests with @smoke and run just those with --grep "@smoke".`;

interface Slot {
  id: string;
  state: 'free' | 'reserved' | 'conflict';
}

const SLOT_IDS = Array.from({ length: 12 }, (_, i) => `S-${i + 1}`);

export default function Parallelism() {
  const [slots, setSlots] = useState<Slot[]>(SLOT_IDS.map((id) => ({ id, state: 'free' })));
  const [message, setMessage] = useState('');

  const refresh = async () => {
    try {
      const data = await apiFetch<{ reserved: string[] }>('/api/reservations');
      setSlots((prev) => prev.map((s) => ({ ...s, state: data.reserved.includes(s.id) ? 'reserved' : 'free' })));
    } catch {
      setMessage('Practice API unreachable — npm run dev starts it.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const reserve = async (id: string) => {
    setMessage('');
    try {
      await apiFetch(`/api/reserve/${id}`, { method: 'POST' });
      setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'reserved' } : s)));
      setMessage(`Slot ${id} reserved (HTTP 201).`);
    } catch (err) {
      setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'conflict' } : s)));
      setMessage(err instanceof Error ? `Slot ${id}: ${err.message} (HTTP 409)` : 'Request failed');
    }
  };

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }} data-testid="slot-grid">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="card"
            data-testid={`slot-${slot.id}`}
            data-state={slot.state}
            style={{
              textAlign: 'center',
              padding: '0.8rem 0.5rem',
              borderColor: slot.state === 'reserved' ? '#bfe8cd' : slot.state === 'conflict' ? '#f3c2bc' : undefined,
              background: slot.state === 'reserved' ? 'var(--green-soft)' : slot.state === 'conflict' ? 'var(--red-soft)' : undefined,
            }}
          >
            <p style={{ fontWeight: 800, margin: 0 }}>{slot.id}</p>
            <p className="small muted" style={{ margin: '0.2rem 0 0.5rem' }}>
              {slot.state}
            </p>
            <button type="button" className="btn subtle" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => reserve(slot.id)} disabled={slot.state === 'reserved'}>
              Reserve {slot.id}
            </button>
          </div>
        ))}
      </div>
      <p className="status-region" data-testid="slot-message">
        {message || 'Click a slot to reserve it — or let 12 parallel tests race for them.'}
      </p>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'parallelism',
  track: 'advanced',
  title: 'Parallelism & Control',
  summary: 'Workers, sharding, parameterized tests, tags and grep — against a collision-free reservation API.',
  concepts: ['fullyParallel', 'workers & shards', 'parameterized tests', 'grep / tags', 'unique test data'],
  task: TASK,
  hints: [
    'Each slot accepts exactly one reservation: the first caller gets 201, everyone else 409. Parallel tests must therefore use unique slot ids — the golden rule of parallel-safe test data.',
    'Parameterize: for (const slot of ["S-1","S-2",...]) { test(`reserve ${slot}`, async ({ request }) => { ... }) } with test.describe.configure({ mode: "parallel" }).',
    'Run a subset: tag titles with @smoke and use npx playwright test --grep "@smoke". Shards split the file list: --shard=1/2.',
  ],
  solution: `import { test, expect } from '@playwright/test';

const SLOTS = ['S-1', 'S-2', 'S-3', 'S-4', 'S-5', 'S-6', 'S-7', 'S-8', 'S-9', 'S-10', 'S-11', 'S-12'];

test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ request }) => {
  // fresh reservations for the whole suite (once, in a setup project in real life)
});

for (const slot of SLOTS) {
  test(\`reserve \${slot} in its own worker @smoke\`, async ({ request }) => {
    const res = await request.post(\`/api/reserve/\${slot}\`);
    // collision-free BECAUSE the id is unique per test
    expect(res.status()).toBe(201);
  });
}

test('double reservation conflicts', async ({ request }) => {
  const first = await request.post('/api/reserve/S-99');
  expect(first.status()).toBe(201);
  const second = await request.post('/api/reserve/S-99');
  expect(second.status()).toBe(409);
  expect((await second.json()).error).toContain('already reserved');
});`,
  example: 'examples/advanced/parallelism.spec.ts',
  path: '/advanced/parallelism',
};
