import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import type { ChallengeMeta } from '../../lib/types';
import { apiFetch, clearSession, getUser, getToken, setSession, type AppUser } from '../../lib/api';
import { formatPrice } from '../../lib/types';
import { useToast } from '../../lib/toast';

const TASK = `The capstone: a complete e-commerce flow that deserves a real test architecture.

1. Explore: log in (standard@demo.io / secret123), browse the catalog, add products, adjust quantities, check out, and view the order under "Orders".
2. Watch the traps: eight "Add to cart" buttons on one page (strict mode!), formatted prices ($12.00 — regex!), loading skeletons, toasts, role-protected admin page.
3. Architecture goal: build Page Objects (LoginPage, CatalogPage, CartPage, CheckoutPage) and a custom authedUser fixture that logs in via API and injects the session — then write the end-to-end purchase test.
4. Extra credit: make the suite parallel-safe with unique products, and cover the admin 403 path.`;

interface Product {
  id: string;
  name: string;
  priceCents: number;
  category: string;
  emoji: string;
}

type Cart = Record<string, number>;

interface ShopContextValue {
  products: Product[];
  loadingProducts: boolean;
  cart: Cart;
  addToCart: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  user: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop outside ShopProvider');
  return ctx;
}

function ShopProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<Cart>(() => {
    try {
      return JSON.parse(localStorage.getItem('pph.shop.cart') ?? '{}') as Cart;
    } catch {
      return {};
    }
  });
  const [user, setUser] = useState<AppUser | null>(getUser());

  useEffect(() => {
    apiFetch<{ products: Product[] }>('/api/products')
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('pph.shop.cart', JSON.stringify(cart));
  }, [cart]);

  const value: ShopContextValue = {
    products,
    loadingProducts,
    cart,
    addToCart: (id, qty = 1) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + qty })),
    setQty: (id, qty) =>
      setCart((c) => {
        const next = { ...c };
        if (qty <= 0) delete next[id];
        else next[id] = Math.min(99, qty);
        return next;
      }),
    removeFromCart: (id) =>
      setCart((c) => {
        const next = { ...c };
        delete next[id];
        return next;
      }),
    clearCart: () => setCart({}),
    user,
    login: async (email, password) => {
      const res = await apiFetch<{ token: string; user: AppUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(res.token, res.user);
      setUser(res.user);
    },
    logout: () => {
      clearSession();
      setUser(null);
    },
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

function ShopNav() {
  const { cart, user, logout } = useShop();
  const navigate = useNavigate();
  const itemCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  return (
    <nav className="shop-nav" aria-label="Shop navigation" data-testid="shop-nav">
      <NavLink to="/shop" end>
        Catalog
      </NavLink>
      <NavLink to="/shop/cart">
        Cart <span className="cart-count" data-testid="cart-count">{itemCount}</span>
      </NavLink>
      <NavLink to="/shop/orders">Orders</NavLink>
      <NavLink to="/shop/admin">Admin</NavLink>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
        {user ? (
          <>
            <span className="small" data-testid="shop-user">
              {user.name} <span className="badge basic" style={{ textTransform: 'none' }}>{user.role}</span>
            </span>
            <button
              type="button"
              className="btn subtle"
              style={{ padding: '0.3rem 0.7rem' }}
              data-testid="shop-logout"
              onClick={() => {
                logout();
                navigate('/shop');
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <NavLink to="/shop/login">Log in</NavLink>
        )}
      </span>
    </nav>
  );
}

function Catalog() {
  const { products, loadingProducts, addToCart } = useShop();
  const { notify } = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const visible = products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase())),
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="product-search">Search products</label>
          <input id="product-search" type="search" data-testid="product-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Fixture" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="category-filter">Category</label>
          <select id="category-filter" data-testid="category-filter" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <p className="small muted" data-testid="catalog-count" style={{ alignSelf: 'end' }}>
          {loadingProducts ? 'Loading…' : `${visible.length} product(s)`}
        </p>
      </div>

      {loadingProducts ? (
        <div className="shop-grid" data-testid="catalog-skeleton">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card product-card">
              <div className="skeleton" style={{ height: '2rem', width: '3rem' }} />
              <div className="skeleton" style={{ width: '70%' }} />
              <div className="skeleton" style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="status-region err">The catalog could not be loaded — is the practice API running?</p>
      ) : (
        <div className="shop-grid" data-testid="catalog-grid">
          {visible.map((p) => (
            <div key={p.id} className="card product-card" data-testid={`product-${p.id}`}>
              <span className="emoji" aria-hidden="true">
                {p.emoji}
              </span>
              <h3 data-testid={`product-name-${p.id}`}>{p.name}</h3>
              <p className="small muted" aria-hidden="true">
                {p.name} — {p.category}
              </p>
              <p className="price" data-testid={`product-price-${p.id}`}>
                {formatPrice(p.priceCents)}
              </p>
              <button type="button" className="btn" data-testid={`add-to-cart-${p.id}`} onClick={() => { addToCart(p.id); notify(`${p.name} added to cart`, 'success'); }}>
                Add to cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Login() {
  const { login } = useShop();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <form
      className="card"
      style={{ maxWidth: 420 }}
      data-testid="shop-login-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError('');
        try {
          await login(email, password);
          notify('Welcome back!', 'success');
          navigate('/shop');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Login failed');
        }
      }}
    >
      <h2>Shop login</h2>
      <p className="small muted">standard@demo.io / secret123 · admin@demo.io / admin123</p>
      <div className="field">
        <label htmlFor="shop-email">Email</label>
        <input id="shop-email" type="email" data-testid="shop-email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="shop-password">Password</label>
        <input id="shop-password" type="password" data-testid="shop-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && (
        <p className="error-text" role="alert" data-testid="shop-login-error">
          {error}
        </p>
      )}
      <button type="submit" className="btn" data-testid="shop-login-submit">
        Log in
      </button>
    </form>
  );
}

function Cart() {
  const { cart, products, setQty, removeFromCart, loadingProducts } = useShop();
  const navigate = useNavigate();
  const { user } = useShop();

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
    .filter((l): l is { product: Product; qty: number } => Boolean(l.product));
  const total = lines.reduce((sum, l) => sum + l.product.priceCents * l.qty, 0);

  if (!getToken()) {
    return (
      <div className="card" style={{ maxWidth: 460 }}>
        <h2>Cart is locked 🔒</h2>
        <p className="muted">Please log in to view your cart — a nice auth-guard flow to test.</p>
        <NavLink to="/shop/login" className="btn">
          Go to login
        </NavLink>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Your cart</h2>
      {loadingProducts ? (
        <div className="skeleton" style={{ width: '60%' }} />
      ) : lines.length === 0 ? (
        <p data-testid="cart-empty">Your cart is empty — add something from the catalog.</p>
      ) : (
        <>
          <table className="data" data-testid="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Line total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map(({ product, qty }) => (
                <tr key={product.id}>
                  <td>
                    {product.emoji} {product.name}
                  </td>
                  <td>
                    <button type="button" className="btn subtle" style={{ padding: '0.1rem 0.55rem' }} aria-label={`Decrease ${product.name}`} data-testid={`qty-dec-${product.id}`} onClick={() => setQty(product.id, qty - 1)}>
                      −
                    </button>{' '}
                    <strong data-testid={`qty-${product.id}`}>{qty}</strong>{' '}
                    <button type="button" className="btn subtle" style={{ padding: '0.1rem 0.55rem' }} aria-label={`Increase ${product.name}`} data-testid={`qty-inc-${product.id}`} onClick={() => setQty(product.id, qty + 1)}>
                      +
                    </button>
                  </td>
                  <td className="price">{formatPrice(product.priceCents * qty)}</td>
                  <td>
                    <button type="button" className="btn danger" style={{ padding: '0.15rem 0.55rem', fontSize: '0.8rem' }} data-testid={`remove-${product.id}`} onClick={() => removeFromCart(product.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '1.15rem' }}>
            Total: <strong className="price" data-testid="cart-total">{formatPrice(total)}</strong>
          </p>
          <button type="button" className="btn" data-testid="go-checkout" onClick={() => navigate('/shop/checkout')}>
            Proceed to checkout
          </button>
        </>
      )}
      {!user && <p className="small muted">You are browsing as a guest — checkout requires login.</p>}
    </div>
  );
}

function Checkout() {
  const { cart, products, clearCart, user } = useShop();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [card, setCard] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<{ id: string; totalCents: number } | null>(null);
  const [placing, setPlacing] = useState(false);

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
    .filter((l): l is { product: Product; qty: number } => Boolean(l.product));
  const total = lines.reduce((sum, l) => sum + l.product.priceCents * l.qty, 0);

  if (!user) {
    return <Navigate to="/shop/login" replace />;
  }

  if (confirmation) {
    return (
      <div className="card" style={{ maxWidth: 480 }} data-testid="order-confirmation">
        <h2 style={{ color: 'var(--green)' }}>🎉 Order {confirmation.id} confirmed!</h2>
        <p>
          Total charged: <strong className="price">{formatPrice(confirmation.totalCents)}</strong>
        </p>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <NavLink to="/shop/orders" className="btn secondary">
            View orders
          </NavLink>
          <NavLink to="/shop" className="btn subtle">
            Keep shopping
          </NavLink>
        </div>
      </div>
    );
  }

  const valid = name.trim().length > 1 && address.trim().length > 3 && city.trim().length > 1 && /^\d{4,6}$/.test(zip) && /^\d{16}$/.test(card.replace(/\s/g, ''));

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h2>Checkout</h2>
      {lines.length === 0 ? (
        <p className="muted">Your cart is empty.</p>
      ) : (
        <>
          <p className="small muted">
            {lines.length} line item(s) — total <strong className="price">{formatPrice(total)}</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="co-name">Full name</label>
              <input id="co-name" data-testid="co-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="co-address">Address</label>
              <input id="co-address" data-testid="co-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="co-city">City</label>
              <input id="co-city" data-testid="co-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="co-zip">ZIP code</label>
              <input id="co-zip" data-testid="co-zip" inputMode="numeric" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="co-card">Card number (16 digits, any digits work)</label>
              <input
                id="co-card"
                data-testid="co-card"
                inputMode="numeric"
                placeholder="4111 1111 1111 1111"
                value={card}
                onChange={(e) => setCard(e.target.value.replace(/[^\d]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19))}
              />
            </div>
          </div>
          {error && (
            <p className="error-text" role="alert" data-testid="checkout-error">
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn"
            data-testid="place-order"
            disabled={!valid || placing}
            onClick={async () => {
              setPlacing(true);
              setError('');
              try {
                const order = await apiFetch<{ id: string; totalCents: number }>('/api/orders', {
                  method: 'POST',
                  body: JSON.stringify({ items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })) }),
                });
                clearCart();
                setConfirmation(order);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Order failed');
              } finally {
                setPlacing(false);
              }
            }}
          >
            {placing ? 'Placing order…' : `Place order — ${formatPrice(total)}`}
          </button>
        </>
      )}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState<{ id: string; totalCents: number; createdAt: string; items: { name: string; quantity: number }[] }[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) return;
    apiFetch<{ orders: typeof orders }>('/api/orders')
      .then((data) => setOrders(data.orders ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'));
  }, []);

  if (!getToken()) return <Navigate to="/shop/login" replace />;

  return (
    <div className="card">
      <h2>Order history</h2>
      {error && <p className="error-text">{error}</p>}
      {!orders ? (
        <div className="skeleton" style={{ width: '50%' }} />
      ) : orders.length === 0 ? (
        <p data-testid="orders-empty">No orders yet — the checkout flow awaits your test.</p>
      ) : (
        <table className="data" data-testid="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.id}</strong>
                </td>
                <td>{o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</td>
                <td className="price">{formatPrice(o.totalCents)}</td>
                <td className="small">{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Admin() {
  const [stats, setStats] = useState<{ articles: number; orders: number; uploads: number; uptimeSec: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<typeof stats>('/api/admin/stats')
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'));
  }, []);

  return (
    <div className="card">
      <h2>Admin area</h2>
      {error ? (
        <div data-testid="admin-denied">
          <p className="status-region err" role="alert">
            🚫 {error}
          </p>
          <p className="small muted">
            This is the graceful 403/401 path — log in as <code>admin@demo.io</code> to see the metrics.
          </p>
        </div>
      ) : !stats ? (
        <div className="skeleton" style={{ width: '40%' }} />
      ) : (
        <table className="data" data-testid="admin-stats">
          <tbody>
            <tr>
              <td>Articles</td>
              <td>{stats.articles}</td>
            </tr>
            <tr>
              <td>Orders</td>
              <td data-testid="stat-orders">{stats.orders}</td>
            </tr>
            <tr>
              <td>Uploaded files</td>
              <td>{stats.uploads}</td>
            </tr>
            <tr>
              <td>API uptime</td>
              <td>{stats.uptimeSec}s</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Shop() {
  return (
    <ShopProvider>
      <ShopNav />
      <Routes>
        <Route index element={<Catalog />} />
        <Route path="login" element={<Login />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<Orders />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </ShopProvider>
  );
}

export const meta: Omit<ChallengeMeta, 'component'> = {
  id: 'pom-capstone',
  track: 'advanced',
  title: 'Capstone: POM & Custom Fixtures',
  summary: 'A full e-commerce shop: login, catalog, cart, checkout, orders and role-gated admin — begging for Page Objects.',
  concepts: ['Page Object Model', 'custom fixtures', 'api login + storageState', 'parallel-safe cart data', 'role-based UI'],
  task: TASK,
  hints: [
    'Scope add-to-cart by product card: page.getByTestId("product-p-2").getByRole("button", { name: "Add to cart" }) — unscoped, getByRole("button", { name: "Add to cart" }) throws a strict-mode violation with 8 matches.',
    'Prices render like $12.00 — assert with expect(page.getByTestId("cart-total")).toHaveText(/^\\$\\d+\\.\\d{2}$/) or compute expectations from the products API.',
    'Custom fixture sketch: export const test = base.extend<{ authedUser: Page }>({ authedUser: async ({ page, request }, use) => { login via API, seed localStorage token with addInitScript, await use(page) } }).',
    'The cart lives in localStorage (key "pph.shop.cart") — seed it or assert it directly for fast cart-state tests without UI clicking.',
  ],
  solution: `import { test as base, expect, type Page } from '@playwright/test';

// ---------- Page Objects ----------
class LoginPage {
  constructor(private page: Page) {}
  async open() { await this.page.goto('/shop/login'); }
  async login(email: string, password: string) {
    await this.page.getByTestId('shop-email').fill(email);
    await this.page.getByTestId('shop-password').fill(password);
    await this.page.getByTestId('shop-login-submit').click();
  }
}

class CatalogPage {
  constructor(private page: Page) {}
  product(id: string) { return this.page.getByTestId(\`product-\${id}\`); }
  async addToCart(id: string) {
    await this.product(id).getByRole('button', { name: 'Add to cart' }).click();
  }
}

// ---------- Custom fixture: user logged in via API ----------
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page, request }, use) => {
    const res = await request.post('/auth/login', {
      data: { email: 'standard@demo.io', password: 'secret123' },
    });
    const { token, user } = await res.json();
    await page.addInitScript(([t, u]) => {
      localStorage.setItem('pph.token', t);
      localStorage.setItem('pph.user', JSON.stringify(u));
    }, [token, user] as const);
    await use(page);
  },
});

// ---------- The capstone flow ----------
test('purchase flow end to end', async ({ authedPage, request }) => {
  const catalog = new CatalogPage(authedPage);
  await authedPage.goto('/shop');
  await expect(catalog.product('p-1')).toBeVisible(); // skeletons resolved

  await catalog.addToCart('p-1');
  await catalog.addToCart('p-1'); // quantity 2
  await expect(authedPage.getByTestId('cart-count')).toHaveText('2');

  await authedPage.getByTestId('shop-nav').getByRole('link', { name: 'Cart' }).click();
  await expect(authedPage.getByTestId('cart-total')).toHaveText('$24.00');

  await authedPage.getByTestId('go-checkout').click();
  await authedPage.getByTestId('co-name').fill('Ada Lovelace');
  await authedPage.getByTestId('co-address').fill('12 Analytical Way');
  await authedPage.getByTestId('co-city').fill('London');
  await authedPage.getByTestId('co-zip').fill('1234');
  await authedPage.getByTestId('co-card').fill('4111111111111111');
  await authedPage.getByTestId('place-order').click();

  await expect(authedPage.getByTestId('order-confirmation')).toContainText(/Order ORD-\\d+ confirmed/);
});

test('admin area is role-gated', async ({ authedPage }) => {
  await authedPage.goto('/shop/admin');
  await expect(authedPage.getByTestId('admin-denied')).toContainText('Forbidden');
});`,
  example: 'examples/shop/capstone.spec.ts',
  path: '/shop',
};
