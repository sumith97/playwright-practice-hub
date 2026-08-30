import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `New windows, new tabs, popups:

1. Click the "Open a new tab" link (target="_blank") — a new tab opens /pop.html. Assert its URL and title.
2. Click "Open a popup window" (window.open) — same target page, different mechanism. Assert you can interact with it.
3. In whichever new page you opened, click "Send greeting to opener" — the greeting must show up in the ORIGINAL page's status region below.
4. Bonus: catch the popup event programmatically (page.waitForEvent("popup")) instead of switching contexts manually.`;

export default function WindowsPopups() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; text?: string };
      if (data?.type === 'popup-greeting' && data.text) setGreeting(data.text);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <a href="/pop.html?kind=tab" target="_blank" rel="noreferrer" data-testid="open-tab-link">
          Open a new tab
        </a>
        <button
          type="button"
          className="btn"
          data-testid="open-popup-button"
          onClick={() => window.open('/pop.html?kind=popup', 'practice-popup', 'width=480,height=420')}
        >
          Open a popup window
        </button>
      </div>
      <p className="status-region" data-testid="greeting-region" style={{ marginTop: '1rem' }}>
        {greeting || 'Greetings from opened pages will appear here.'}
      </p>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'windows-popups',
  track: 'intermediate',
  title: 'Windows & Popups',
  summary: 'target="_blank" links, window.open popups, postMessage back to the opener, and popup event handling.',
  concepts: ['context pages', 'waitForEvent("popup")', 'target=_blank', 'window.open', 'postMessage'],
  task: TASK,
  hints: [
    'target="_blank" opens a new page in the same context. Catch it: const popupPromise = page.waitForEvent("popup"); await link.click(); const popup = await popupPromise;',
    'Assertions run against the new page object: expect(popup).toHaveTitle("New tab page") — the page title depends on the ?kind= parameter.',
    'To get the greeting back on the opener page, interact with the popup (click its button), then assert on the ORIGINAL page object — the message flows via postMessage.',
  ],
  solution: `test('tabs and popups', async ({ page }) => {
  await page.goto('/intermediate/windows-popups');

  // new tab via target="_blank"
  const tabPromise = page.waitForEvent('popup');
  await page.getByTestId('open-tab-link').click();
  const tab = await tabPromise;
  await expect(tab).toHaveURL(/pop\\.html\\?kind=tab/);
  await expect(tab).toHaveTitle('Popup');
  await expect(tab.locator('#popup-title')).toHaveText('New tab page');

  // popup via window.open
  const popupPromise = page.waitForEvent('popup');
  await page.getByTestId('open-popup-button').click();
  const popup = await popupPromise;
  await expect(popup).toHaveTitle('Popup');
  await expect(popup.locator('#popup-kind')).toHaveText('"popup"');

  // greet the opener from the popup
  await popup.getByRole('button', { name: 'Send greeting to opener' }).click();
  await expect(popup.locator('#popup-status')).toContainText('Greeting sent');
  await expect(page.getByTestId('greeting-region')).toContainText('Hi from the popup page!');
});`,
  example: 'examples/intermediate/windows-popups.spec.ts',
  path: '/intermediate/windows-popups',
};
