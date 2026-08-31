/* Test Run Analysis dashboard — vanilla JS + Chart.js */
'use strict';

const state = { records: [], charts: {} };

const $ = (sel) => document.querySelector(sel);
const fmtDate = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtMs = (ms) => {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
};
const esc = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(message, ms = 3500) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), ms);
}

async function api(path, method = 'GET') {
  const res = await fetch(path, { method });
  const body = await res.json();
  if (!res.ok || body.ok === false) throw new Error(body.error ?? `request failed (${res.status})`);
  return body;
}

/* ---------- aggregation ---------- */

function filterRecords() {
  const branch = $('#branch-filter').value;
  const source = $('#source-filter').value;
  return state.records.filter(
    (r) => (!branch || r.branch === branch) && (!source || r.source === source),
  );
}

function aggregateTests(records) {
  const byTest = new Map();
  for (const run of records) {
    for (const t of run.tests ?? []) {
      const key = `${t.title} [${t.project}]`;
      const agg = byTest.get(key) ?? { title: t.title, project: t.project, runs: 0, flaky: 0, failed: 0, skipped: 0, totalMs: 0, maxMs: 0 };
      agg.runs += 1;
      if (t.status === 'flaky') agg.flaky += 1;
      if (t.status === 'unexpected' || t.status === 'interrupted') agg.failed += 1;
      if (t.status === 'skipped') agg.skipped += 1;
      else {
        agg.totalMs += t.durationMs ?? 0;
        agg.maxMs = Math.max(agg.maxMs, t.durationMs ?? 0);
      }
      byTest.set(key, agg);
    }
  }
  return [...byTest.values()];
}

/* ---------- rendering ---------- */

function renderKpis(records) {
  $('#kpi-runs').textContent = records.length;
  const withTotals = records.filter((r) => r.stats.total > 0);
  const avg = (arr, f) => (arr.length ? arr.reduce((s, r) => s + f(r), 0) / arr.length : 0);
  const avgPass = avg(withTotals, (r) => ((r.stats.passed + r.stats.flaky) / r.stats.total) * 100);
  $('#kpi-pass').textContent = withTotals.length ? `${avgPass.toFixed(1)}%` : '–';
  $('#kpi-duration').textContent = withTotals.length ? fmtMs(avg(records, (r) => r.durationMs)) : '–';
  const flaky = new Set(
    aggregateTests(records).filter((t) => t.flaky > 0).map((t) => `${t.title} [${t.project}]`),
  );
  $('#kpi-flaky').textContent = flaky.size;
}

function labelFor(run) {
  return `${fmtDate(run.startedAt)}${run.source === 'ci' ? ' (CI)' : ''}`;
}

function renderCharts(records) {
  const ordered = [...records].sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  const labels = ordered.map(labelFor);

  const outcomeData = {
    labels,
    datasets: [
      { label: 'Passed', data: ordered.map((r) => r.stats.passed), backgroundColor: '#16a34a', stack: 's' },
      { label: 'Failed', data: ordered.map((r) => r.stats.failed), backgroundColor: '#dc2626', stack: 's' },
      { label: 'Flaky', data: ordered.map((r) => r.stats.flaky), backgroundColor: '#f59e0b', stack: 's' },
      { label: 'Skipped', data: ordered.map((r) => r.stats.skipped), backgroundColor: '#94a3b8', stack: 's' },
    ],
  };

  const passRates = ordered.map((r) => (r.stats.total ? ((r.stats.passed + r.stats.flaky) / r.stats.total) * 100 : 0));
  const durations = ordered.map((r) => Math.round((r.durationMs ?? 0) / 1000));

  const baseOpts = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { boxWidth: 12 } } },
  };

  for (const id of ['chart-outcomes', 'chart-trend']) {
    state.charts[id]?.destroy();
  }
  state.charts['chart-outcomes'] = new Chart($('#chart-outcomes'), {
    type: 'bar',
    data: outcomeData,
    options: { ...baseOpts, scales: { x: { stacked: true }, y: { stacked: true } } },
  });
  state.charts['chart-trend'] = new Chart($('#chart-trend'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Pass rate %', data: passRates, yAxisID: 'y', borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.08)', fill: true, tension: 0.3 },
        { label: 'Duration (s)', data: durations, yAxisID: 'y1', borderColor: '#92400e', borderDash: [5, 4], tension: 0.3, pointRadius: 3 },
      ],
    },
    options: {
      ...baseOpts,
      scales: {
        y: { min: 0, max: 100, position: 'left', title: { display: true, text: '% passed' } },
        y1: { position: 'right', title: { display: true, text: 'seconds' }, grid: { drawOnChartArea: false } },
      },
    },
  });
}

function renderRuns(records) {
  const tbody = $('#runs-table tbody');
  const recent = [...records].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt))).slice(0, 15);
  tbody.innerHTML = recent
    .map(
      (r) => `<tr>
        <td>${fmtDate(r.startedAt)}</td>
        <td><span class="badge ${esc(r.source)}">${esc(r.source)}</span></td>
        <td>${esc(r.branch || '—')}</td>
        <td>${r.sha ? `<code>${esc(r.sha.slice(0, 7))}</code>` : '—'}</td>
        <td class="num">${r.stats.passed}</td>
        <td class="num ${r.stats.failed ? 'failed' : ''}">${r.stats.failed}</td>
        <td class="num">${r.stats.flaky}</td>
        <td class="num">${r.stats.skipped}</td>
        <td class="num">${fmtMs(r.durationMs)}</td>
        <td>${r.runUrl ? `<a href="${esc(r.runUrl)}" target="_blank" rel="noreferrer">open ↗</a>` : ''}</td>
      </tr>`,
    )
    .join('');
}

function renderRankings(records) {
  const tests = aggregateTests(records);

  const flaky = tests
    .filter((t) => t.flaky > 0 || t.failed > 0)
    .sort((a, b) => b.flaky - a.flaky || b.failed - a.failed)
    .slice(0, 10);
  $('#flaky-table tbody').innerHTML = flaky.length
    ? flaky
        .map((t) => {
          const relevant = t.runs - t.skipped;
          const rate = relevant ? (((relevant - t.failed) / relevant) * 100).toFixed(0) : '100';
          return `<tr>
            <td class="test-title" title="${esc(t.title)}">${esc(t.title)}</td>
            <td class="num">${t.flaky}</td>
            <td class="num">${t.failed}</td>
            <td class="num">${rate}%</td>
          </tr>`;
        })
        .join('')
    : '<tr><td colspan="4" class="muted">No failures or flakes recorded. 🎉</td></tr>';

  const slow = tests
    .filter((t) => t.runs > t.skipped)
    .map((t) => ({ ...t, avg: t.totalMs / (t.runs - t.skipped) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);
  $('#slow-table tbody').innerHTML = slow
    .map(
      (t) => `<tr>
        <td class="test-title" title="${esc(t.title)}">${esc(t.title)}</td>
        <td>${esc(t.project)}</td>
        <td class="num">${fmtMs(t.avg)}</td>
        <td class="num">${fmtMs(t.maxMs)}</td>
      </tr>`,
    )
    .join('');
}

function render() {
  const records = filterRecords();
  const empty = records.length === 0;
  for (const id of ['empty-state', 'kpis', 'charts', 'runs-section', 'flaky-section', 'slow-section']) {
    $(`#${id}`).classList.toggle('hidden', id === 'empty-state' ? !empty : empty);
  }
  if (empty) return;

  renderKpis(records);
  renderCharts(records);
  renderRuns(records);
  renderRankings(records);
}

function fillBranchFilter() {
  const branches = [...new Set(state.records.map((r) => r.branch).filter(Boolean))];
  const current = $('#branch-filter').value;
  $('#branch-filter').innerHTML =
    '<option value="">all</option>' + branches.map((b) => `<option ${b === current ? 'selected' : ''}>${esc(b)}</option>`).join('');
}

async function load() {
  const body = await api('/api/history');
  state.records = body.records;
  fillBranchFilter();
  render();
}

function wire() {
  $('#branch-filter').addEventListener('change', render);
  $('#source-filter').addEventListener('change', render);

  $('#btn-record').addEventListener('click', async (e) => {
    e.target.disabled = true;
    try {
      const body = await api('/api/record', 'POST');
      toast(`Recorded ${body.recorded} — ${body.total} run(s) in history`);
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      e.target.disabled = false;
    }
  });

  $('#btn-sync').addEventListener('click', async (e) => {
    e.target.disabled = true;
    try {
      const body = await api('/api/sync', 'POST');
      toast(body.added > 0 ? `Synced ${body.added} new run(s) from CI` : 'Already up to date');
      await load();
    } catch (err) {
      toast(err.message);
    } finally {
      e.target.disabled = false;
    }
  });
}

wire();
load().catch((err) => toast(`failed to load history: ${err.message}`));
