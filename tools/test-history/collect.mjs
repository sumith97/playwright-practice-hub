#!/usr/bin/env node
/**
 * Convert a Playwright JSON report into a compact, append-friendly
 * "run record" for the test history store.
 *
 * CLI usage:
 *   node collect.mjs <report.json> [--out file] [--source ci|local]
 *        [--run-id id] [--run-url url] [--sha sha] [--branch name] [--event name]
 *
 * Also importable: exports buildRecord() for other tools.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) opts[a.slice(2)] = argv[++i];
    else opts._.push(a);
  }
  return opts;
}

function walkSuite(suite, pathTitles, rows) {
  const titles = [...pathTitles, suite.title].filter(Boolean);
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const durationMs = (test.results ?? []).reduce((sum, r) => sum + (r.duration ?? 0), 0);
      rows.push({
        title: [...titles, spec.title].join(' › '),
        file: spec.file ?? '',
        project: test.projectName ?? '',
        status: test.status, // expected | unexpected | flaky | skipped | interrupted
        durationMs,
      });
    }
  }
  for (const child of suite.suites ?? []) walkSuite(child, titles, rows);
}

function statsFromRows(rows) {
  const count = (st) => rows.filter((r) => r.status === st).length;
  return {
    startTime: new Date().toISOString(),
    duration: 0,
    expected: count('expected'),
    unexpected: count('unexpected') + count('interrupted'),
    flaky: count('flaky'),
    skipped: count('skipped'),
  };
}

/**
 * Build a run record from a Playwright JSON report (direct reporter output or
 * merge-reports output — both share the same shape).
 */
export function buildRecord(report, meta = {}) {
  const rows = [];
  for (const suite of report.suites ?? []) walkSuite(suite, [], rows);
  const s = report.stats ?? statsFromRows(rows);
  const startedAt = s.startTime ?? new Date().toISOString();

  return {
    schema: 1,
    runId: meta.runId ?? `local-${startedAt}`,
    source: meta.source ?? 'local',
    sha: meta.sha ?? '',
    branch: meta.branch ?? '',
    event: meta.event ?? '',
    runUrl: meta.runUrl ?? '',
    startedAt,
    durationMs: s.duration ?? 0,
    stats: {
      passed: s.expected ?? 0,
      failed: s.unexpected ?? 0,
      flaky: s.flaky ?? 0,
      skipped: s.skipped ?? 0,
      total: rows.length,
    },
    tests: rows,
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const input = opts._[0];
  if (!input) {
    console.error('usage: node collect.mjs <report.json> [--out file] [--source ci|local] [--run-id id] ...');
    process.exit(2);
  }
  const report = JSON.parse(readFileSync(input, 'utf8'));
  const record = buildRecord(report, {
    source: opts.source ?? 'local',
    runId: opts['run-id'],
    runUrl: opts['run-url'],
    sha: opts.sha,
    branch: opts.branch,
    event: opts.event,
  });
  if (opts.out) {
    mkdirSync(dirname(resolve(opts.out)), { recursive: true });
    writeFileSync(opts.out, JSON.stringify(record));
    console.log(
      `run record written: ${opts.out} (${record.stats.passed} passed, ${record.stats.failed} failed, ` +
        `${record.stats.flaky} flaky, ${record.stats.skipped} skipped)`,
    );
  } else {
    process.stdout.write(JSON.stringify(record));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
