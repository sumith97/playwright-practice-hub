import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';
import { getUser, type AppUser } from '../../lib/api';

const TASK = `Stop logging in inside every test — wire the canonical session-reuse architecture:

1. Create a setup spec (examples/expert/auth.setup.ts is the reference): it logs in via the API, seeds localStorage, and saves the context with page.context().storageState({ path: 'examples/expert/.auth/user.json' }).
2. Register it in playwright.config.ts as a dedicated "setup" project, and make your browser project depend on it (dependencies: ['setup']) with storageState pointing at the saved file.
3. From now on, every test starts ALREADY logged in — navigate to this page and assert the protected area shows "Sam Standard" without a single login step.
4. Prove the flip side: a fresh context WITHOUT storageState still sees the locked panel (isolation preserved).

The playground below is the verification surface: it unlocks purely from localStorage state, exactly like the shop and auth pages.`;

export default function SetupAuth() {
  const [user] = useState<AppUser | null>(getUser());

  return (
    <div>
      <div className="card" data-testid="protected-area">
        {user ? (
          <div data-testid="protected-user-panel">
            <h2 style={{ color: 'var(--green)' }}>🔓 Protected content</h2>
            <p>
              Signed in as <strong data-testid="protected-user">{user.name}</strong>{' '}
              <span className="badge basic" style={{ textTransform: 'none' }}>{user.role}</span>
            </p>
            <p className="small muted">This panel unlocked from the restored session — no login was performed in this test.</p>
          </div>
        ) : (
          <div data-testid="protected-locked">
            <h2>🔒 Locked</h2>
            <p>No session found in localStorage — exactly what a fresh, unauthenticated context should see.</p>
          </div>
        )}
      </div>

      <div className="panel" style={{ marginTop: '1rem' }}>
        <h3>The canonical pattern (for your own suite)</h3>
        <pre>
          <code>{`// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /auth\\.setup\\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'examples/expert/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});

// examples/expert/auth.setup.ts
import { test as setup } from '@playwright/test';
setup('authenticate', async ({ page, request }) => {
  const res = await request.post('/auth/login', { data: CREDENTIALS });
  const { token, user } = await res.json();
  await page.goto('/advanced/auth');
  await page.evaluate(([t, u]) => {
    localStorage.setItem('pph.token', t);
    localStorage.setItem('pph.user', JSON.stringify(u));
  }, [token, user]);
  await page.context().storageState({ path: 'examples/expert/.auth/user.json' });
});`}</code>
        </pre>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'setup-auth',
  track: 'expert',
  title: 'Setup Project & storageState',
  summary: 'The canonical auth architecture: log in once in a setup project, reuse the session via storageState file.',
  concepts: ['setup projects', 'project dependencies', 'storageState file', 'testIgnore', 'session reuse'],
  task: TASK,
  hints: [
    'storageState captures BOTH cookies and localStorage — that is why it works for our localStorage-token app, not just cookie sessions.',
    'A setup project is just a project whose testMatch selects only the setup file. Dependents are skipped (with a clear message) if the setup fails — a built-in safety net.',
    'Remember testIgnore: /auth\\.setup\\.ts/ on your browser projects, otherwise the setup spec runs again as a normal test in every browser.',
    'APIRequestContext.storageState() only captures COOKIES. To include localStorage you must set it on a real page (page.evaluate) before calling page.context().storageState({ path }).',
  ],
  solution: `// The reference solution is two files, both in the repo:

// 1) examples/expert/auth.setup.ts  (runs as the 'setup' project)
import { test as setup } from '@playwright/test';
import { STANDARD_USER } from '../utils';

setup('authenticate', async ({ page, request }) => {
  const res = await request.post('/auth/login', { data: STANDARD_USER });
  const { token, user } = await res.json();
  await page.goto('/advanced/auth');
  await page.evaluate(([t, u]) => {
    localStorage.setItem('pph.token', t);
    localStorage.setItem('pph.user', JSON.stringify(u));
  }, [token, user]);
  await page.context().storageState({ path: 'examples/expert/.auth/user.json' });
});

// 2) playwright.config.ts — setup project + dependency (see the config)
// The verification test then just opens the page:
test('protected area unlocks with zero login steps', async ({ browser }) => {
  const page = await (await browser.newContext({ storageState: 'examples/expert/.auth/user.json' })).newPage();
  await page.goto('/expert/setup-auth');
  await expect(page.getByTestId('protected-user')).toHaveText('Sam Standard');
});

test('a context without storageState stays locked', async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/expert/setup-auth');
  await expect(page.getByTestId('protected-locked')).toBeVisible();
});`,
  example: 'examples/expert/setup-auth.spec.ts',
  path: '/expert/setup-auth',
};
