import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Accessibility is assertable — and snapshots make structure reviewable:

1. This page follows good practices: landmarks with labels, labeled inputs, named buttons, an aria-live status region. Capture its structure with expect(page.getByRole("main")).toMatchAriaSnapshot() and review the YAML it produces.
2. The "shady widget" below breaks the rules: an image without alt text, an unlabeled input, and a clickable div without a role. Find the violations — with aria snapshots or axe-core via page.evaluate.
3. Use the live region: click "Notify" and assert the announcement via the polite live region.`;

export default function A11y() {
  const [announcement, setAnnouncement] = useState('');
  const [shadyMessage, setShadyMessage] = useState('');

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div className="card" aria-label="Newsletter signup">
        <h3>Newsletter signup (good a11y)</h3>
        <div className="field">
          <label htmlFor="nl-email">Email address</label>
          <input id="nl-email" type="email" data-testid="nl-email" placeholder="ada@example.com" />
        </div>
        <button type="button" className="btn" data-testid="nl-submit" onClick={() => setAnnouncement('Thanks! Check your inbox to confirm the subscription.')}>
          Subscribe to newsletter
        </button>
        <p role="status" aria-live="polite" data-testid="a11y-status" style={{ minHeight: '1.5rem', fontWeight: 600 }}>
          {announcement || 'Status announcements appear here.'}
        </p>
      </div>

      <div className="card" aria-label="Shady widget">
        <h3>Shady widget (bad a11y on purpose)</h3>
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%234f46e5'/%3E%3C/svg%3E" width={40} height={40} style={{ display: 'block' }} />
        <input type="text" placeholder="unlabeled-input" data-testid="shady-input" style={{ margin: '0.6rem 0' }} />
        <div
          onClick={() => setShadyMessage('Div clicked')}
          data-testid="shady-button"
          style={{ background: 'var(--accent)', color: '#fff', display: 'inline-block', padding: '0.4rem 0.9rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Clickable div (no role)
        </div>
        {shadyMessage && (
          <p className="small muted" style={{ marginTop: '0.5rem' }}>
            {shadyMessage}
          </p>
        )}
        <ul className="small muted" style={{ marginTop: '0.8rem', paddingLeft: '1.2rem' }}>
          <li>Image has no alt attribute (axe: image-alt)</li>
          <li>
            Input has no label element — but its placeholder computes an accessible name, so axe's
            label rule passes it. A placeholder is a poor substitute for a real label; automated
            tools cannot judge that.
          </li>
          <li>Click handler on a div with no role/keyboard support (invisible to role locators)</li>
        </ul>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'a11y',
  track: 'advanced',
  title: 'A11y & ARIA Snapshots',
  summary: 'Capture page structure with aria snapshots, spot violations, and assert live-region announcements.',
  concepts: ['toMatchAriaSnapshot', 'aria-live regions', 'axe-core integration', 'accessible names'],
  task: TASK,
  hints: [
    'ARIA snapshots: await expect(page.getByRole("main")).toMatchAriaSnapshot("- main:\n  - text: Newsletter signup") — or store a YAML file and compare. Great for reviewing structure in code review.',
    'axe-core: npm i -D axe-core, then inject and run it: await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") }); const results = await page.evaluate(() => axe.run()); assert results.violations is empty for the good card.',
    'Live regions: the status paragraph is role="status" — after clicking Subscribe, assert its text. The announcement updates without focus changes.',
  ],
  solution: `import { test, expect } from '@playwright/test';

test('aria snapshot of the good card', async ({ page }) => {
  await page.goto('/advanced/a11y');
  // file-based aria snapshot: generate with --update-snapshots, review in PRs
  await expect(page.locator('[aria-label="Newsletter signup"]')).toMatchAriaSnapshot();
});

test('live region announces the result', async ({ page }) => {
  await page.goto('/advanced/a11y');
  await page.getByTestId('nl-submit').click();
  await expect(page.getByTestId('a11y-status')).toContainText('Thanks! Check your inbox');
});

test('axe-core finds the violations', async ({ page }) => {
  await page.goto('/advanced/a11y');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const { violations } = await page.evaluate(() => (window as any).axe.run());
  const ids = violations.map((v: any) => v.id);
  expect(ids).toContain('image-alt');
  // surprising: the placeholder-named input passes axe's label rule —
  // accessible names exist, quality does not
  expect(ids).not.toContain('label');
});`,
  example: 'examples/advanced/a11y.spec.ts',
  path: '/advanced/a11y',
};
