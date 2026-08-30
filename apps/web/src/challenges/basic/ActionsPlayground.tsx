import { useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Practice the interaction API:

1. Click "Click counter" three times.
2. Double-click "Double-click target".
3. Right-click inside the context menu zone.
4. Hover over the info box to reveal its tooltip.
5. Type into the keyboard field and press keys like Escape or Enter — the field reports each key.
6. Tick the "Subscribe to newsletter" checkbox.
7. Pick a payment method radio button.
8. Choose a shipping option from the native select.
9. Focus, then blur the "Focus watcher" field.`;

export default function ActionsPlayground() {
  const [clicks, setClicks] = useState(0);
  const [dblClicks, setDblClicks] = useState(0);
  const [rightClick, setRightClick] = useState('');
  const [lastKey, setLastKey] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [payment, setPayment] = useState('');
  const [shipping, setShipping] = useState('');
  const [focusMsg, setFocusMsg] = useState('');

  const done =
    clicks >= 3 && dblClicks >= 1 && rightClick && lastKey && subscribed && payment && shipping && focusMsg
      ? 'all'
      : 'some';

  return (
    <div>
      <ul className="checklist" data-testid="actions-checklist">
        <li className={clicks >= 3 ? 'done' : 'pending'}>Click counter pressed 3+ times ({clicks})</li>
        <li className={dblClicks >= 1 ? 'done' : 'pending'}>Double-clicked</li>
        <li className={rightClick ? 'done' : 'pending'}>Right-clicked</li>
        <li className={lastKey ? 'done' : 'pending'}>Key pressed: {lastKey || '—'}</li>
        <li className={subscribed ? 'done' : 'pending'}>Checkbox checked</li>
        <li className={payment ? 'done' : 'pending'}>Radio picked: {payment || '—'}</li>
        <li className={shipping ? 'done' : 'pending'}>Select chosen: {shipping || '—'}</li>
        <li className={focusMsg ? 'done' : 'pending'}>Focus &amp; blur observed</li>
      </ul>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', marginTop: '1rem' }}>
        <div className="card">
          <h3>Clicking</h3>
          <button type="button" className="btn" data-testid="click-counter" onClick={() => setClicks((c) => c + 1)}>
            Click counter
          </button>
          <p>
            Clicks: <strong data-testid="click-count">{clicks}</strong>
          </p>
          <button
            type="button"
            className="btn subtle"
            data-testid="dblclick-target"
            onDoubleClick={() => setDblClicks((c) => c + 1)}
          >
            Double-click target
          </button>
          <p>
            Double-clicks: <strong data-testid="dblclick-count">{dblClicks}</strong>
          </p>
        </div>

        <div className="card">
          <h3>Right click</h3>
          <div
            data-testid="context-zone"
            style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: '1.2rem', textAlign: 'center' }}
            onContextMenu={(e) => {
              e.preventDefault();
              setRightClick(`Custom menu opened at ${e.clientX},${e.clientY}`);
            }}
          >
            Right-click zone
          </div>
          <p className="status-region" data-testid="context-result">
            {rightClick || 'No context menu yet'}
          </p>
        </div>

        <div className="card">
          <h3>Hover</h3>
          <span className="tooltip-host" data-testid="tooltip-host" tabIndex={0}>
            <button type="button" className="btn subtle">Hover over me</button>
            <span className="tooltip-bubble" data-testid="tooltip" role="tooltip">
              Tooltip revealed by hover!
            </span>
          </span>
        </div>

        <div className="card">
          <h3>Keyboard</h3>
          <div className="field">
            <label htmlFor="keyboard-input">Keyboard field</label>
            <input
              id="keyboard-input"
              type="text"
              data-testid="keyboard-input"
              placeholder="press-seq"
              onKeyDown={(e) => setLastKey(`${e.key} (${e.code})`)}
            />
          </div>
          <p className="small">
            Last key: <span className="kbd" data-testid="last-key">{lastKey || '—'}</span>
          </p>
        </div>

        <div className="card">
          <h3>Checkbox &amp; radio</h3>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              data-testid="subscribe-checkbox"
              checked={subscribed}
              onChange={(e) => setSubscribed(e.target.checked)}
            />{' '}
            Subscribe to newsletter
          </label>
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
            <legend>Payment method</legend>
            {['Credit card', 'PayPal', 'Invoice'].map((method) => (
              <label key={method} style={{ display: 'block' }}>
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={payment === method}
                  onChange={() => setPayment(method)}
                />{' '}
                {method}
              </label>
            ))}
          </fieldset>
        </div>

        <div className="card">
          <h3>Select &amp; focus</h3>
          <div className="field">
            <label htmlFor="shipping">Shipping option</label>
            <select id="shipping" data-testid="shipping-select" value={shipping} onChange={(e) => setShipping(e.target.value)}>
              <option value="">Choose…</option>
              <option value="standard">Standard (3-5 days)</option>
              <option value="express">Express (1-2 days)</option>
              <option value="overnight">Overnight</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="focus-watcher">Focus watcher</label>
            <input
              id="focus-watcher"
              type="text"
              data-testid="focus-watcher"
              onFocus={() => setFocusMsg('focused')}
              onBlur={() => setFocusMsg('blurred')}
            />
          </div>
          <p className="small" data-testid="focus-state">
            {focusMsg || 'Never focused'}
          </p>
        </div>
      </div>

      <p className="status-region ok" data-testid="actions-status" style={{ visibility: done === 'all' ? 'visible' : 'hidden' }}>
        All interactions performed — great control!
      </p>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'actions-playground',
  track: 'basics',
  title: 'Actions Playground',
  summary: 'Click, double-click, right-click, hover, press keys, check boxes, pick radios and options, focus and blur.',
  concepts: ['click / dblclick', 'context menu', 'hover', 'keyboard.press', 'check / uncheck', 'selectOption', 'focus / blur'],
  task: TASK,
  hints: [
    'Double-click: locator.dblclick(). Right-click: locator.click({ button: "right" }) — the zone shows a custom menu, not the browser one.',
    'Tooltips that appear on hover are asserted with expect(locator).toBeVisible() after locator.hover(); Playwright auto-waits for the element to appear.',
    'Checkbox: locator.check(). Radio: page.getByLabel("PayPal").check(). Native select: page.getByLabel("Shipping option").selectOption("express") (by value) or selectOption({ label: "Express (1-2 days)" }).',
  ],
  solution: `test('perform every action', async ({ page }) => {
  await page.goto('/basics/actions-playground');

  const counter = page.getByTestId('click-counter');
  await counter.click();
  await counter.click();
  await counter.click();
  await expect(page.getByTestId('click-count')).toHaveText('3');

  await page.getByTestId('dblclick-target').dblclick();
  await page.getByTestId('context-zone').click({ button: 'right' });
  await expect(page.getByTestId('context-result')).toContainText('Custom menu');

  await page.getByTestId('tooltip-host').hover();
  await expect(page.getByTestId('tooltip')).toBeVisible();

  await page.getByTestId('keyboard-input').pressSequentially('hi');
  await page.getByTestId('keyboard-input').press('Enter');
  await page.getByTestId('subscribe-checkbox').check();
  await page.getByRole('radio', { name: 'PayPal' }).check();
  await page.getByTestId('shipping-select').selectOption('express');
  await page.getByTestId('focus-watcher').focus();
  await page.getByTestId('focus-watcher').blur();
});`,
  example: 'examples/basic/actions-playground.spec.ts',
  path: '/basics/actions-playground',
};
