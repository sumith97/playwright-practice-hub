import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch } from '../../lib/api';

const TASK = `One suite, many environments. This widget's UI is driven by a feature flag (localStorage pph.flags = { betaUi: true }) and shows live data from the API — the two things that usually differ between environments:

1. Write ONE data-driven test that renders the page under both flag states (classic and beta) and asserts the right UI appears for each — a loop over an environment matrix, not two copy-pasted tests.
2. Annotate each run with testInfo.annotations so the report shows which environment every result belongs to.
3. Read configuration from the process environment safely (process.env with a documented default) and surface it in the report.
4. Inspect playwright.smoke.config.ts in the repo root — a real layered config: same suite, but grep @smoke, 1 worker, 2 retries. Run it with: npx playwright test -c playwright.smoke.config.ts`;

interface Flags {
  betaUi?: boolean;
}

export default function ConfigLayering() {
  const [flags, setFlags] = useState<Flags>(() => {
    try {
      return JSON.parse(localStorage.getItem('pph.flags') ?? '{}') as Flags;
    } catch {
      return {};
    }
  });
  const [serverTime, setServerTime] = useState('…');

  useEffect(() => {
    apiFetch<{ time: string }>('/api/health')
      .then((h) => setServerTime(h.time))
      .catch(() => setServerTime('unreachable'));
  }, []);

  const beta = Boolean(flags.betaUi);

  const persist = (next: Flags) => {
    setFlags(next);
    localStorage.setItem('pph.flags', JSON.stringify(next));
  };

  return (
    <div>
      <div className="card" data-testid="env-shell">
        <h3>
          Dashboard <span className={`badge ${beta ? 'expert' : 'basic'}`} data-testid="env-badge" style={{ textTransform: 'none' }}>{beta ? 'beta' : 'classic'}</span>
        </h3>
        {beta ? (
          <div data-testid="beta-panel">
            <p>
              <strong>Beta dashboard</strong> — redesigned KPIs, flag-driven.
            </p>
            <div className="kpi-row">
              <div className="card kpi"><span className="kpi-value">99.9%</span><span className="kpi-label">uptime (beta)</span></div>
              <div className="card kpi"><span className="kpi-value">42ms</span><span className="kpi-label">p95 (beta)</span></div>
            </div>
          </div>
        ) : (
          <p data-testid="classic-panel">
            <strong>Classic dashboard</strong> — the long-standing layout.
          </p>
        )}
        <p className="small muted">
          API server time: <code data-testid="env-server-time">{serverTime}</code>
        </p>
        <button
          type="button"
          className="btn subtle"
          data-testid="flag-toggle"
          onClick={() => persist({ betaUi: !beta })}
        >
          {beta ? 'Disable beta UI' : 'Enable beta UI'}
        </button>
      </div>

      <div className="panel" style={{ marginTop: '1rem' }}>
        <h3>The layered config in this repo</h3>
        <pre>
          <code>{`// playwright.smoke.config.ts — a thin layer over the same suite
export default defineConfig({
  testDir: './examples',
  grep: /@smoke/,          // only smoke-tagged tests
  workers: 1,              // serial — gentle on shared staging
  retries: 2,              // staging flakiness allowance
  reporter: [['list']],
  use: { baseURL: process.env.SMOKE_BASE_URL ?? 'http://localhost:5173' },
  webServer: { /* same as base, or pointed at staging */ },
});

// run it: npx playwright test -c playwright.smoke.config.ts`}</code>
        </pre>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'config-layering',
  track: 'real-world',
  title: 'Config Layering & Environments',
  summary: 'One suite, many environments: feature-flag matrices, testInfo annotations, env vars, and layered Playwright configs.',
  concepts: ['multiple configs', 'data-driven matrix', 'testInfo.annotations', 'process.env', 'feature flags'],
  task: TASK,
  hints: [
    'Seed a flag before boot: await page.addInitScript((beta) => localStorage.setItem("pph.flags", JSON.stringify({ betaUi: beta })), true); — no UI clicking needed to "get into" an environment.',
    'The matrix pattern: for (const env of [{name:"classic",beta:false},{name:"beta",beta:true}]) test(\`renders $\{env.name}\`, ...) — one loop, two tagged rows in the report.',
    'Annotations: testInfo.annotations.push({ type: "environment", description: env.name }) — they show in the HTML report and in testHistory records.',
    'Env vars arrive at CONFIG LOAD time (playwright.config.ts runs in Node) but also inside tests via process.env — always with a default: process.env.PPH_ENV ?? "local".',
  ],
  solution: `const ENV_MATRIX = [
  { name: 'classic', beta: false },
  { name: 'beta', beta: true },
] as const;

for (const env of ENV_MATRIX) {
  test(\`dashboard renders in \${env.name} mode\`, async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'environment', description: env.name });

    await page.addInitScript(
      (beta) => localStorage.setItem('pph.flags', JSON.stringify({ betaUi: beta })),
      env.beta,
    );
    await page.goto('/real-world/config-layering');

    await expect(page.getByTestId('env-badge')).toHaveText(env.name);
    if (env.beta) {
      await expect(page.getByTestId('beta-panel')).toBeVisible();
    } else {
      await expect(page.getByTestId('classic-panel')).toBeVisible();
    }
  });
}

test('environment comes from the process env with a default', async ({ page }, testInfo) => {
  const env = process.env.PPH_ENV ?? 'local';
  testInfo.annotations.push({ type: 'environment', description: env });
  expect(['local', 'ci', 'staging']).toContain(env);

  await page.goto('/real-world/config-layering');
  await expect(page.getByTestId('env-server-time')).toContainText(/T\\d{2}:\\d{2}/);
});`,
  example: 'examples/real-world/config-layering.spec.ts',
  path: '/real-world/config-layering',
};
