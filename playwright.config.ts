import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Practice Hub — reference test suite.
 *
 * These tests are the "dogfooding" layer: every challenge on the site ships
 * with a reference test here, and CI requires all of them to pass. If a test
 * breaks, the challenge broke.
 *
 * Start the stack first (or let the webServer entries below do it):
 *   npm run dev
 *   npm run test:examples
 */
export default defineConfig({
  testDir: './examples',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // WebKit's device descriptor is named "Desktop Safari" in Playwright's registry
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
