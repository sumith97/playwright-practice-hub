import { defineConfig } from '@playwright/test';

/**
 * A layered config over the same example suite: smoke tests only, serial,
 * with retries. Demonstrates config layering for the /real-world/config-layering
 * challenge — the default `playwright.config.ts` remains the full CI config.
 *
 *   npx playwright test -c playwright.smoke.config.ts
 */
export default defineConfig({
  testDir: './examples',
  grep: /@smoke/,
  fullyParallel: false,
  workers: 1,
  retries: 2,
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev -w apps/api',
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -w apps/web',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
