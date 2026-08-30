import { useEffect, useRef } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Shadow DOM components hide their internals — Playwright locators pierce open shadow roots automatically:

1. Type a value into the input inside the FIRST shadow root and click its button — the status inside that root updates.
2. The second widget nests a shadow root INSIDE another shadow root. Fill the nested input and click "Save nested value" — assert the nested confirmation.
3. Bonus: prove you did not need special APIs — no frameLocator, no pierce() — just regular locators.`;

export default function ShadowDom() {
  const outerHost = useRef<HTMLDivElement>(null);
  const nestedHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!outerHost.current || outerHost.current.shadowRoot) return;

    const outer = outerHost.current.attachShadow({ mode: 'open' });
    outer.innerHTML = `
      <style>
        .panel { border: 1px solid #c9cde0; border-radius: 8px; padding: 12px; background: #fff; font-family: system-ui, sans-serif; }
        input { padding: 5px 8px; border: 1px solid #b9c0d4; border-radius: 6px; }
        button { padding: 5px 10px; border: none; border-radius: 6px; background: #4f46e5; color: #fff; font-weight: 600; cursor: pointer; margin-left: 6px; }
        p { min-height: 1.2em; color: #16803c; font-weight: 700; margin: 8px 0 0; }
        h4 { margin: 0 0 6px; }
      </style>
      <div class="panel">
        <h4>Single shadow root</h4>
        <input placeholder="outer-secret" aria-label="Outer value" />
        <button>Save outer value</button>
        <p data-status="idle">Not saved yet.</p>
      </div>
    `;
    const button = outer.querySelector('button')!;
    const input = outer.querySelector('input')!;
    const status = outer.querySelector('p')!;
    button.addEventListener('click', () => {
      status.textContent = input.value ? `Saved: "${input.value}"` : 'Saved: (empty)';
      status.dataset.status = 'saved';
    });
  }, []);

  useEffect(() => {
    if (!nestedHost.current || nestedHost.current.shadowRoot) return;

    const outer = nestedHost.current.attachShadow({ mode: 'open' });
    outer.innerHTML = `
      <style> .wrap { font-family: system-ui, sans-serif; } h4 { margin: 0 0 6px; } </style>
      <div class="wrap">
        <h4>Nested shadow roots</h4>
        <div data-testid="inner-host"></div>
      </div>
    `;
    const innerHost = outer.querySelector('[data-testid=inner-host]')!;
    const inner = innerHost.attachShadow({ mode: 'open' });
    inner.innerHTML = `
      <style>
        .panel { border: 1px solid #d6b98c; border-radius: 8px; padding: 12px; background: #fff7ed; }
        input { padding: 5px 8px; border: 1px solid #d6b98c; border-radius: 6px; }
        button { padding: 5px 10px; border: none; border-radius: 6px; background: #92400e; color: #fff; font-weight: 600; cursor: pointer; margin-left: 6px; }
        p { min-height: 1.2em; color: #92400e; font-weight: 700; margin: 8px 0 0; }
      </style>
      <div class="panel">
        <input placeholder="inner-secret" aria-label="Inner value" />
        <button>Save nested value</button>
        <p data-status="idle">Not saved yet.</p>
      </div>
    `;
    const button = inner.querySelector('button')!;
    const input = inner.querySelector('input')!;
    const status = inner.querySelector('p')!;
    button.addEventListener('click', () => {
      status.textContent = input.value ? `Nested saved: "${input.value}"` : 'Nested saved: (empty)';
      status.dataset.status = 'saved';
    });
  }, []);

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div className="shadow-widget" data-testid="shadow-host" ref={outerHost} />
      <div className="shadow-widget" data-testid="nested-shadow-host" ref={nestedHost} />
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'shadow-dom',
  track: 'advanced',
  title: 'Shadow DOM',
  summary: 'Locate and interact with elements inside open shadow roots — including one nested inside another.',
  concepts: ['shadow piercing locators', 'open vs closed roots', 'nested shadow roots'],
  task: TASK,
  hints: [
    'CSS and text locators pierce open shadow roots transparently: page.getByPlaceholder("outer-secret") works even though the input lives inside a shadow root.',
    'Aria-role locators work too — the inputs have aria-labels ("Outer value" / "Inner value").',
    'For the nested widget you still use a flat locator: page.getByPlaceholder("inner-secret"). Playwright traverses both shadow boundaries.',
  ],
  solution: `test('pierce shadow roots', async ({ page }) => {
  await page.goto('/advanced/shadow-dom');

  // single shadow root
  await page.getByPlaceholder('outer-secret').fill('top-secret');
  await page.getByRole('button', { name: 'Save outer value' }).click();
  await expect(page.getByText('Saved: "top-secret"')).toBeVisible();

  // nested shadow roots — same flat locators
  await page.getByPlaceholder('inner-secret').fill('deep-secret');
  await page.getByRole('button', { name: 'Save nested value' }).click();
  await expect(page.getByText('Nested saved: "deep-secret"')).toBeVisible();
});`,
  example: 'examples/advanced/shadow-dom.spec.ts',
  path: '/advanced/shadow-dom',
};
