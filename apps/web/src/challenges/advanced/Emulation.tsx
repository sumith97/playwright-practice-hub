import { useEffect, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Emulation lets your tests become any user, any device, anywhere:

1. Click "Request location" — with the geolocation permission granted and coordinates set via context options, the widget shows your (fake) coordinates.
2. Check the color scheme indicator — emulate dark mode with colorScheme: 'dark' in newContext or page.emulateMedia.
3. Compare the viewport readout with your test's viewport — emulate an iPhone with devices['iPhone 13'].
4. The locale and timezone panels reflect context options like locale: 'de-DE' and timezoneId: 'Europe/Berlin' — assert the German number format (0,99) and the Berlin clock.`;

export default function Emulation() {
  const [coords, setCoords] = useState('');
  const [geoError, setGeoError] = useState('');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setColorScheme(e.matches ? 'dark' : 'light');
    media.addEventListener('change', listener);
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => {
      media.removeEventListener('change', listener);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const requestLocation = () => {
    setCoords('');
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
      (err) => setGeoError(err.message || 'Permission denied'),
      { timeout: 5000 },
    );
  };

  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div className="card">
        <h3>Geolocation</h3>
        <button type="button" className="btn subtle" data-testid="request-location" onClick={requestLocation}>
          Request location
        </button>
        <p className="status-region" data-testid="geo-result">
          {coords ? `📍 ${coords}` : geoError ? `Error: ${geoError}` : 'No location yet.'}
        </p>
      </div>

      <div className="card">
        <h3>Color scheme</h3>
        <p data-testid="color-scheme">
          Browser prefers <strong>{colorScheme}</strong> mode.
        </p>
        <p className="small muted">
          Emulate with <code>{"colorScheme: 'dark'"}</code> in context options or{' '}
          <code>{"page.emulateMedia({ colorScheme: 'dark' })"}</code>.
        </p>
      </div>

      <div className="card">
        <h3>Viewport</h3>
        <p data-testid="viewport-readout">
          {viewport.w} × {viewport.h} px
        </p>
        <p className="small muted">Resize or use devices['iPhone 13'] — the readout follows live.</p>
      </div>

      <div className="card">
        <h3>Locale & formatting</h3>
        <p>
          navigator.language: <code data-testid="locale-readout">{navigator.language}</code>
        </p>
        <p>
          Number 0.99 → <strong data-testid="number-readout">{new Intl.NumberFormat().format(0.99)}</strong>
        </p>
        <p>
          Date sample → <span data-testid="date-readout">{new Intl.DateTimeFormat().format(new Date(2026, 7, 30))}</span>
        </p>
      </div>

      <div className="card">
        <h3>Timezone</h3>
        <p data-testid="timezone-readout">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        <p className="small muted">Set with timezoneId: 'Europe/Berlin' in test.use / newContext.</p>
      </div>
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'emulation',
  track: 'advanced',
  title: 'Emulation & Permissions',
  summary: 'Geolocation, color schemes, devices/viewport, locale, timezone — make your tests any user on any device.',
  concepts: ['geolocation + permissions', 'colorScheme emulation', 'devices registry', 'locale / timezoneId'],
  task: TASK,
  hints: [
    'Geolocation needs permission AND coordinates: test.use({ permissions: ["geolocation"], geolocation: { latitude: 52.373, longitude: 4.892 } }).',
    'Media emulation: test.use({ colorScheme: "dark" }) or await page.emulateMedia({ colorScheme: "dark" }) — the widget listens to change events live.',
    'Devices: test.use({ ...devices["iPhone 13"] }) sets viewport, UA and touch together. Locale/timezone: test.use({ locale: "de-DE", timezoneId: "Europe/Berlin" }).',
  ],
  solution: `import { test, expect, devices } from '@playwright/test';

test.use({ permissions: ['geolocation'], geolocation: { latitude: 52.373, longitude: 4.892 } });

test('fake geolocation', async ({ page }) => {
  await page.goto('/advanced/emulation');
  await page.getByTestId('request-location').click();
  await expect(page.getByTestId('geo-result')).toContainText('52.373');
});

test('dark mode emulation', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/advanced/emulation');
  await expect(page.getByTestId('color-scheme')).toContainText('dark');
});

test('mobile device emulation', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  await page.goto('/advanced/emulation');
  await expect(page.getByTestId('viewport-readout')).toHaveText(/390 × \\d+ px/);
  await context.close();
});

test('german locale and berlin timezone', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const page = await context.newPage();
  await page.goto('/advanced/emulation');
  await expect(page.getByTestId('locale-readout')).toHaveText('de-DE');
  await expect(page.getByTestId('number-readout')).toHaveText('0,99');
  await expect(page.getByTestId('timezone-readout')).toHaveText('Europe/Berlin');
  await context.close();
});`,
  example: 'examples/advanced/emulation.spec.ts',
  path: '/advanced/emulation',
};
