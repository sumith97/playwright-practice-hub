import { useEffect, useRef, useState } from 'react';
import type { ChallengeMeta } from '../../lib/types';

const TASK = `Kill the classic "a popup swallowed my click" flake — declaratively:

A promotional overlay pops up on this page on its own schedule and blocks every click until dismissed (this is what cookie walls, notification permission prompts and "loading" spinners feel like in real apps).

1. First, feel the pain: write a test that clicks the four "Add to cart" buttons WITHOUT any special handling — it times out whenever the overlay is up.
2. Fix it with ONE registration before acting: page.addLocatorHandler(page.getByTestId('promo-overlay'), dismissIt). Playwright now auto-dismisses the overlay whenever it intercepts an action, then retries the click.
3. Assert all four products end up in the cart, and that the overlay was dismissed at least once along the way (the counter increments on every close).`;

const PRODUCTS = [
  { id: 'p-1', emoji: '🧯', name: 'Flake Extinguisher' },
  { id: 'p-2', emoji: '🪝', name: 'Hook of Retries' },
  { id: 'p-3', emoji: '🛡️', name: 'Strict-Mode Shield' },
  { id: 'p-4', emoji: '🔭', name: 'Trace Telescope' },
];

export default function LocatorHandler() {
  const [cart, setCart] = useState<string[]>([]);
  const [promoVisible, setPromoVisible] = useState(false);
  const [dismissed, setDismissed] = useState(0);
  const timer = useRef<number | null>(null);

  // schedule the next popup whenever the current one is dismissed
  useEffect(() => {
    if (promoVisible) return;
    timer.current = window.setTimeout(() => setPromoVisible(true), 3000);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [promoVisible]);

  useEffect(() => {
    const initial = window.setTimeout(() => setPromoVisible(true), 1200);
    return () => window.clearTimeout(initial);
  }, []);

  const dismiss = () => {
    setPromoVisible(false);
    setDismissed((d) => d + 1);
  };

  return (
    <div>
      <div className="card">
        <h3>Products</h3>
        <p className="small muted" data-testid="cart-line">
          Cart: <strong data-testid="expert-cart-count">{cart.length}</strong> item(s)
        </p>
        <div className="shop-grid">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="card product-card" data-testid={`expert-card-${p.id}`}>
              <span className="emoji" aria-hidden="true">{p.emoji}</span>
              <h4>{p.name}</h4>
              <button
                type="button"
                className="btn"
                data-testid={`expert-add-${p.id}`}
                onClick={() => setCart((c) => [...c, p.id])}
              >
                Add to cart
              </button>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: '0.8rem' }} data-testid="promo-dismissed-count">
          Overlay dismissed {dismissed} time(s) this session.
        </p>
      </div>

      {promoVisible && (
        <div className="modal-overlay" data-testid="promo-overlay">
          <div className="modal" role="dialog" aria-label="Promotion">
            <h3>🎉 50% OFF everything!</h3>
            <p className="small muted">
              This overlay intercepts every pointer event on the page — the classic cookie-wall problem.
            </p>
            <button type="button" className="btn secondary" data-testid="promo-close" onClick={dismiss}>
              ✕ Dismiss promotion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'locator-handler',
  track: 'expert',
  title: 'Overlay Clinic (addLocatorHandler)',
  summary: 'Auto-dismiss popups and cookie walls that intercept clicks — Playwright\'s declarative answer to UI noise.',
  concepts: ['addLocatorHandler', 'actionability interception', 'auto-retry after handler', 'times option'],
  task: TASK,
  hints: [
    'Register the handler BEFORE the actions: page.addLocatorHandler(locator, handler). Whenever the locator becomes visible during an action\'s actionability check, the handler runs, then Playwright retries the original action.',
    'The handler receives the matched locator: page.addLocatorHandler(page.getByTestId("promo-overlay"), async (overlay) => { await overlay.getByTestId("promo-close").click(); });',
    'Pass { times: 3 } as the third argument to auto-dismiss only the first three appearances — after that Playwright stops calling the handler (useful for "first visit only" dialogs).',
    'This replaces the old page.on-dialog-style workarounds for overlays. It only fires when the element actually INTERCEPTS — a visible banner in a corner that does not block clicks will not trigger it.',
  ],
  solution: `test('dismiss the promo overlay automatically whenever it blocks an action', async ({ page }) => {
  await page.goto('/expert/locator-handler');

  // one registration, everywhere, forever (add { times: N } to limit it)
  await page.addLocatorHandler(page.getByTestId('promo-overlay'), async (overlay) => {
    await overlay.getByTestId('promo-close').click();
  });

  // these clicks survive the overlay popping up at any moment
  for (const id of ['p-1', 'p-2', 'p-3', 'p-4']) {
    await page.getByTestId(\`expert-add-\${id}\`).click();
  }

  await expect(page.getByTestId('expert-cart-count')).toHaveText('4');
  await expect(page.getByTestId('promo-dismissed-count')).not.toHaveText('0');
});`,
  example: 'examples/expert/locator-handler.spec.ts',
  path: '/expert/locator-handler',
};
