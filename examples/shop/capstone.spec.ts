import { test as base, expect, type Page } from '@playwright/test';
import { loginViaApi, STANDARD_USER } from '../utils';

// ---------- Page Objects ----------
class LoginPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/shop/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email', { exact: true }).fill(email);
    await this.page.getByLabel('Password', { exact: true }).fill(password);
    await this.page.getByTestId('shop-login-submit').click();
  }
}

class CatalogPage {
  constructor(private page: Page) {}

  product(id: string) {
    return this.page.getByTestId(`product-${id}`);
  }

  async addToCart(id: string) {
    await this.product(id).getByRole('button', { name: 'Add to cart' }).click();
  }
}

class CartPage {
  constructor(private page: Page) {}

  async open() {
    // the link's accessible name includes the cart count ("Cart 2") — match with a regex
    await this.page.getByTestId('shop-nav').getByRole('link', { name: /Cart/ }).click();
  }
}

class CheckoutPage {
  constructor(private page: Page) {}

  async fillDetails(data: { name: string; address: string; city: string; zip: string; card: string }) {
    await this.page.getByLabel('Full name').fill(data.name);
    await this.page.getByLabel('Address').fill(data.address);
    await this.page.getByLabel('City').fill(data.city);
    await this.page.getByLabel('ZIP code').fill(data.zip);
    await this.page.getByLabel('Card number (16 digits, any digits work)').fill(data.card);
  }

  place() {
    return this.page.getByTestId('place-order').click();
  }
}

// ---------- Custom fixture: a user authenticated via API, session seeded ----------
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page, request }, use) => {
    const session = await loginViaApi(request, STANDARD_USER);
    await page.addInitScript(
      ([token, user]) => {
        localStorage.setItem('pph.token', token);
        localStorage.setItem('pph.user', JSON.stringify(user));
      },
      [session.token, session.user],
    );
    await use(page);
  },
});

test('login through the UI with a Page Object', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login(STANDARD_USER.email, STANDARD_USER.password);

  await expect(page.getByTestId('shop-user')).toContainText('Sam Standard');
});

test('search and filter the catalog', async ({ page }) => {
  await page.goto('/shop');
  await expect(page.getByTestId('catalog-grid').locator('.product-card')).toHaveCount(8);

  await page.getByLabel('Search products').fill('fixture');
  await expect(page.getByTestId('catalog-count')).toContainText('1 product');

  await page.getByLabel('Search products').fill('');
  await page.getByLabel('Category').selectOption('plushies');
  await expect(page.getByTestId('catalog-grid').locator('.product-card')).toHaveCount(4);
});

test('full purchase flow with the authed fixture', async ({ authedPage }) => {
  const page = authedPage;
  const catalog = new CatalogPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  await page.goto('/shop');
  await expect(page.getByTestId('catalog-skeleton')).toHaveCount(0);
  await expect(page.getByTestId('catalog-grid')).toBeVisible();

  // strict-mode discipline: scope the button to its product card
  await catalog.addToCart('p-1');
  await catalog.addToCart('p-1');
  await expect(page.getByTestId('cart-count')).toHaveText('2');

  await cart.open();
  await expect(page.getByTestId('cart-table').locator('tbody tr')).toHaveCount(1);
  await expect(page.getByTestId('cart-total')).toHaveText('$24.00');

  await page.getByTestId('go-checkout').click();
  await checkout.fillDetails({
    name: 'Ada Lovelace',
    address: '12 Analytical Way',
    city: 'London',
    zip: '1234',
    card: '4111111111111111',
  });
  await checkout.place();

  await expect(page.getByTestId('order-confirmation')).toContainText(/Order ORD-\d{4} confirmed!/);
  await expect(page.getByTestId('order-confirmation')).toContainText('$24.00');

  // cart is empty again after a confirmed order
  await expect(page.getByTestId('cart-count')).toHaveText('0');
});

test('order shows up in history', async ({ authedPage }) => {
  const page = authedPage;
  await page.goto('/shop');
  await new CatalogPage(page).addToCart('p-2');
  await new CartPage(page).open();
  await page.getByTestId('go-checkout').click();
  await new CheckoutPage(page).fillDetails({
    name: 'Sam Standard',
    address: '1 Test Lane',
    city: 'Utrecht',
    zip: '3511',
    card: '4242424242424242',
  });
  await page.getByTestId('place-order').click();
  await expect(page.getByTestId('order-confirmation')).toBeVisible();

  await page.getByTestId('shop-nav').getByRole("link", { name: "Orders" }).click();
  await expect(page.getByTestId('orders-table').locator('tbody tr').first()).toBeVisible();
  await expect(page.getByTestId('orders-table')).toContainText('Assertion Owl');
});

test('guests are redirected away from checkout', async ({ page }) => {
  await page.goto('/shop/checkout');
  await expect(page).toHaveURL(/\/shop\/login/);
  await expect(page.getByTestId('shop-login-form')).toBeVisible();
});

test('admin area is role-gated for standard users', async ({ authedPage }) => {
  await authedPage.goto('/shop/admin');
  await expect(authedPage.getByTestId('admin-denied')).toContainText('Forbidden');
});
