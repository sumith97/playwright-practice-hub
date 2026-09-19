import { test, expect } from '@playwright/test';

test.describe('Real World · Multi-User Contexts', () => {
  test('agent and customer talk in two isolated contexts', async ({ browser }) => {
    const ctxA = await browser.newContext();
    await ctxA.addInitScript(() => sessionStorage.setItem('pph.support.nick', 'agent-smith'));
    const ctxB = await browser.newContext();
    await ctxB.addInitScript(() => sessionStorage.setItem('pph.support.nick', 'customer-jones'));

    const agent = await ctxA.newPage();
    const customer = await ctxB.newPage();
    await agent.goto('/real-world/multi-user');
    await customer.goto('/real-world/multi-user');

    await expect(agent.getByTestId('support-status')).toHaveText('connected', { timeout: 10_000 });
    await expect(customer.getByTestId('support-status')).toHaveText('connected', { timeout: 10_000 });
    await expect(agent.getByTestId('support-identity')).toHaveText('agent-smith');
    await expect(customer.getByTestId('support-identity')).toHaveText('customer-jones');

    // customer asks; the agent's context receives it live
    await customer.getByTestId('support-input').fill('Where is my order ORD-7731?');
    await customer.getByTestId('support-send').click();
    await expect(agent.getByTestId('support-log')).toContainText('customer-jones: Where is my order ORD-7731?');

    // agent replies; the customer's context receives it live
    await agent.getByTestId('support-input').fill('Shipping today!');
    await agent.getByTestId('support-send').click();
    await expect(customer.getByTestId('support-log')).toContainText('agent-smith: Shipping today!');

    // storage isolation: each context keeps its own identity
    expect(await agent.evaluate(() => sessionStorage.getItem('pph.support.nick'))).toBe('agent-smith');
    expect(await customer.evaluate(() => sessionStorage.getItem('pph.support.nick'))).toBe('customer-jones');

    await ctxA.close();
    await ctxB.close();
  });

  test('nicknames typed in the UI persist per context only', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/real-world/multi-user');
    await expect(page.getByTestId('support-status')).toHaveText('connected', { timeout: 10_000 });

    await page.getByTestId('support-nick').fill('solo-tester');
    expect(await page.evaluate(() => sessionStorage.getItem('pph.support.nick'))).toBe('solo-tester');
    await expect(page.getByTestId('support-identity')).toHaveText('solo-tester');

    // a second context in the SAME test never sees it
    const other = await (await browser.newContext()).newPage();
    await other.goto('/real-world/multi-user');
    await expect(other.getByTestId('support-identity')).toHaveText('anon');
    await ctx.close();
  });
});
