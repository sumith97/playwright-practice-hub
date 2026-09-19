import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_MATRIX = [
  { name: 'classic', beta: false },
  { name: 'beta', beta: true },
] as const;

test.describe('Real World · Config Layering & Environments', () => {
  for (const env of ENV_MATRIX) {
    test(`dashboard renders in ${env.name} mode`, async ({ page }, testInfo) => {
      testInfo.annotations.push({ type: 'environment', description: env.name });

      await page.addInitScript(
        (beta) => localStorage.setItem('pph.flags', JSON.stringify({ betaUi: beta })),
        env.beta,
      );
      await page.goto('/real-world/config-layering');

      await expect(page.getByTestId('env-badge')).toHaveText(env.name);
      if (env.beta) {
        await expect(page.getByTestId('beta-panel')).toBeVisible();
        await expect(page.getByTestId('classic-panel')).toHaveCount(0);
      } else {
        await expect(page.getByTestId('classic-panel')).toBeVisible();
        await expect(page.getByTestId('beta-panel')).toHaveCount(0);
      }
    });
  }

  test('the UI toggle writes the flag without a reload', async ({ page }) => {
    await page.goto('/real-world/config-layering');
    await expect(page.getByTestId('env-badge')).toHaveText('classic');

    await page.getByTestId('flag-toggle').click();
    await expect(page.getByTestId('env-badge')).toHaveText('beta');
    expect(await page.evaluate(() => localStorage.getItem('pph.flags'))).toBe('{"betaUi":true}');
  });

  test('environment comes from the process env with a default @smoke', async ({ page }, testInfo) => {
    const env = process.env.PPH_ENV ?? 'local';
    testInfo.annotations.push({ type: 'environment', description: env });
    expect(['local', 'ci', 'staging', 'production']).toContain(env);

    await page.goto('/real-world/config-layering');
    // live environment data: the API answers with a timestamp
    await expect(page.getByTestId('env-server-time')).toContainText(/T\d{2}:\d{2}/);
  });

  test('the layered smoke config exists and layers correctly', () => {
    const smokePath = resolve(process.cwd(), 'playwright.smoke.config.ts');
    expect(existsSync(smokePath)).toBe(true);

    const smoke = readFileSync(smokePath, 'utf8');
    expect(smoke).toContain('@smoke'); // greps only tagged tests
    expect(smoke).toContain('workers: 1'); // serial execution
    expect(smoke).toContain('retries: 2'); // staging resilience
    expect(smoke).toContain('SMOKE_BASE_URL'); // env-overridable target
  });
});
