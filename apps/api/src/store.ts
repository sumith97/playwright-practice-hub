/**
 * In-memory data store for the practice API.
 * All state lives here so `POST /api/reset` can restore a clean slate —
 * that is exactly how the reference tests isolate themselves.
 */

export interface Article {
  id: string;
  title: string;
  body: string;
  tags: string[];
}

export interface Product {
  id: string;
  name: string;
  priceCents: number;
  category: string;
  emoji: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  priceCents: number;
}

export interface Order {
  id: string;
  email: string;
  items: OrderItem[];
  totalCents: number;
  status: 'confirmed';
  createdAt: string;
}

export interface StoredFile {
  name: string;
  size: number;
  content: Buffer;
}

export interface AnalyticsEvent {
  event: string;
  props: Record<string, unknown>;
  ts: number;
}

export const seedArticles: Article[] = [
  { id: 'a-1', title: 'Why auto-waiting changed E2E testing', body: 'Playwright waits for elements to be visible, stable and enabled before acting. No more arbitrary sleeps.', tags: ['auto-wait', 'basics'] },
  { id: 'a-2', title: 'Locators: role-first thinking', body: 'Prefer user-facing locators like getByRole over brittle CSS selectors. They mirror how users find things.', tags: ['locators', 'basics'] },
  { id: 'a-3', title: 'Fixtures are dependency injection for tests', body: 'Custom fixtures let you compose page objects, auth state and test data declaratively.', tags: ['fixtures', 'advanced'] },
  { id: 'a-4', title: 'Network mocking without a backend', body: 'page.route lets you fulfill, redirect or abort requests. Test edge cases without staging environments.', tags: ['network', 'advanced'] },
  { id: 'a-5', title: 'Traces: the time machine', body: 'A trace viewer snapshot shows DOM, network, console and actions for every step of a failed test.', tags: ['debugging', 'advanced'] },
];

export const products: Product[] = [
  { id: 'p-1', name: 'Locator Lens', priceCents: 1200, category: 'tools', emoji: '🔍' },
  { id: 'p-2', name: 'Assertion Owl', priceCents: 2450, category: 'plushies', emoji: '🦉' },
  { id: 'p-3', name: 'Fixture Fox', priceCents: 1899, category: 'plushies', emoji: '🦊' },
  { id: 'p-4', name: 'Tracer Thunderbolt', priceCents: 4999, category: 'toys', emoji: '⚡' },
  { id: 'p-5', name: 'Mock Mockingbird', priceCents: 3100, category: 'plushies', emoji: '🐦' },
  { id: 'p-6', name: 'Selector Socks', priceCents: 850, category: 'apparel', emoji: '🧦' },
  { id: 'p-7', name: 'Retry Rabbit', priceCents: 2200, category: 'plushies', emoji: '🐰' },
  { id: 'p-8', name: 'Coverage Cap', priceCents: 1500, category: 'apparel', emoji: '🧢' },
];

export interface Store {
  articles: Article[];
  orders: Order[];
  orderSeq: number;
  otps: Map<string, { code: string; expiresAt: number }>;
  uploads: StoredFile[];
  flakyAttempts: number;
  reservations: Set<string>;
  rateBuckets: Map<string, { count: number; resetAt: number }>;
  analytics: AnalyticsEvent[];
}

export function createStore(): Store {
  return {
    articles: structuredClone(seedArticles),
    orders: [],
    orderSeq: 0,
    otps: new Map(),
    uploads: [],
    flakyAttempts: 0,
    reservations: new Set(),
    rateBuckets: new Map(),
    analytics: [],
  };
}

export const store: Store = createStore();

export function resetStore(): void {
  Object.assign(store, createStore());
}

export function nextOrderId(): string {
  store.orderSeq += 1;
  return `ORD-${String(store.orderSeq).padStart(4, '0')}`;
}
