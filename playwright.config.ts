import { defineConfig, devices } from '@playwright/test';
import { environmentConfiguration } from './src/config/environment';

/**
 * Playwright configuration — aligned with
 * https://playwright.dev/docs/best-practices
 *
 *   - fullyParallel: tests in a single file run in parallel by default
 *   - retries: only on CI (local failures should be investigated, not retried)
 *   - trace: captured on the first retry of a failed CI test (docs-recommended)
 *
 * No shared auth setup: the core E2E flow registers a fresh user, so tests
 * start from a clean, unauthenticated browser. When future scenarios need
 * a pre-seeded account, reintroduce a `setup` project and storageState.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: environmentConfiguration.uiBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: environmentConfiguration.defaultActionTimeoutMs,
    navigationTimeout: environmentConfiguration.defaultNavigationTimeoutMs,
  },
  projects: [
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: environmentConfiguration.apiBaseUrl,
      },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
