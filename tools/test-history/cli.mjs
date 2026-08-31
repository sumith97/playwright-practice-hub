#!/usr/bin/env node
/**
 * Test-history CLI: append run records to the local JSONL store and sync the
 * CI history (kept on the `test-history` branch) into it.
 *
 *   node cli.mjs record                    # turn test-history/last-run.json into a record and append it
 *   node cli.mjs sync                      # fetch history.jsonl from origin/test-history and merge it in
 *   node cli.mjs append <record.json>      # append an existing run record (used by CI)
 *
 * All commands dedupe by runId and keep the file sorted by startedAt.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildRecord } from './collect.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const HISTORY_FILE = resolve(ROOT, 'test-history/history.jsonl');
const LAST_RUN_FILE = resolve(ROOT, 'test-history/last-run.json');
const HISTORY_BRANCH = process.env.HISTORY_BRANCH ?? 'test-history';

function readHistory(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null; // skip corrupt lines instead of losing the whole file
      }
    })
    .filter(Boolean);
}

function writeHistory(file, records) {
  records.sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, records.map((r) => JSON.stringify(r)).join('\n') + (records.length ? '\n' : ''));
}

/** Merge records into the store: dedupe by runId (newer wins), keep sorted. */
export function mergeRecords(existing, incoming) {
  const byId = new Map(existing.map((r) => [r.runId, r]));
  for (const r of incoming) byId.set(r.runId, r);
  return [...byId.values()];
}

function record() {
  if (!existsSync(LAST_RUN_FILE)) {
    console.error(`no ${LAST_RUN_FILE} — run the tests first (the JSON reporter writes it automatically)`);
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(LAST_RUN_FILE, 'utf8'));
  const record = buildRecord(report, { source: 'local' });
  const merged = mergeRecords(readHistory(HISTORY_FILE), [record]);
  writeHistory(HISTORY_FILE, merged);
  console.log(
    `recorded run ${record.runId} — ${record.stats.passed} passed, ${record.stats.failed} failed, ` +
      `${record.stats.flaky} flaky (${merged.length} runs in history)`,
  );
}

function sync() {
  let remoteHistory;
  try {
    execFileSync('git', ['fetch', 'origin', HISTORY_BRANCH], { cwd: ROOT, stdio: 'pipe' });
    remoteHistory = execFileSync('git', ['show', `FETCH_HEAD:history.jsonl`], { cwd: ROOT, encoding: 'utf8' });
  } catch {
    console.error(`no ${HISTORY_BRANCH} branch on origin yet — it appears after the next CI run`);
    process.exit(1);
  }
  const remote = remoteHistory
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const before = readHistory(HISTORY_FILE);
  const merged = mergeRecords(before, remote);
  writeHistory(HISTORY_FILE, merged);
  console.log(`synced: ${merged.length - before.length} new run(s) from origin/${HISTORY_BRANCH}, ${merged.length} total`);
}

function append(recordFile) {
  if (!existsSync(recordFile)) {
    console.error(`no ${recordFile}`);
    process.exit(1);
  }
  const record = JSON.parse(readFileSync(recordFile, 'utf8'));
  const merged = mergeRecords(readHistory(HISTORY_FILE), [record]);
  writeHistory(HISTORY_FILE, merged);
  console.log(`appended ${record.runId} — history now has ${merged.length} run(s)`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'record') record();
else if (cmd === 'sync') sync();
else if (cmd === 'append') append(resolve(arg ?? 'run-record.json'));
else {
  console.error('usage: node cli.mjs <record|sync|append [record.json]>');
  process.exit(2);
}
