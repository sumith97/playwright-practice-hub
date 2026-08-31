#!/usr/bin/env node
/**
 * Zero-dependency server for the test-history dashboard.
 *
 *   npm run dashboard          → http://localhost:4310
 *
 * API:
 *   GET  /api/history → { records: [...] }      the local JSONL store
 *   POST /api/record  → append test-history/last-run.json as a local run
 *   POST /api/sync    → merge CI history from origin/test-history
 */
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, extname, join, normalize } from 'node:path';
import { buildRecord } from '../collect.mjs';

const PORT = Number(process.env.PORT ?? 4310);
const ROOT = resolve(import.meta.dirname, '../../..');
const HISTORY_BRANCH = process.env.HISTORY_BRANCH ?? 'test-history';
const PUBLIC_DIR = join(import.meta.dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
};

function readHistory() {
  return readFile(resolve(ROOT, 'test-history/history.jsonl'), 'utf8')
    .then((text) =>
      text
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    )
    .catch(() => []);
}

function writeHistory(records) {
  records.sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  return writeFile(
    resolve(ROOT, 'test-history/history.jsonl'),
    records.map((r) => JSON.stringify(r)).join('\n') + (records.length ? '\n' : ''),
  );
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/history') {
    return json(res, 200, { records: await readHistory() });
  }

  if (req.method === 'POST' && pathname === '/api/record') {
    try {
      const report = JSON.parse(await readFile(resolve(ROOT, 'test-history/last-run.json'), 'utf8'));
      const record = buildRecord(report, { source: 'local' });
      const merged = mergeById(await readHistory(), [record]);
      await writeHistory(merged);
      return json(res, 200, { ok: true, recorded: record.runId, total: merged.length });
    } catch (err) {
      return json(res, 400, { ok: false, error: `no local run to record — run the tests first (${err.message})` });
    }
  }

  if (req.method === 'POST' && pathname === '/api/sync') {
    try {
      execFileSync('git', ['fetch', 'origin', HISTORY_BRANCH], { cwd: ROOT, stdio: 'pipe' });
      const remote = execFileSync('git', ['show', 'FETCH_HEAD:history.jsonl'], { cwd: ROOT, encoding: 'utf8' });
      const remoteRecords = remote
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      const before = await readHistory();
      const merged = mergeById(before, remoteRecords);
      await writeHistory(merged);
      return json(res, 200, { ok: true, added: merged.length - before.length, total: merged.length });
    } catch {
      return json(res, 400, { ok: false, error: `no ${HISTORY_BRANCH} branch on origin yet — it appears after the next CI run` });
    }
  }

  json(res, 404, { error: 'not found' });
}

function mergeById(existing, incoming) {
  const byId = new Map(existing.map((r) => [r.runId, r]));
  for (const r of incoming) byId.set(r.runId, r);
  return [...byId.values()];
}

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  try {
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);

    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = normalize(join(PUBLIC_DIR, relative));
    if (!file.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('forbidden');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(PORT, () => {
  console.log(`Test history dashboard → http://localhost:${PORT}`);
});
