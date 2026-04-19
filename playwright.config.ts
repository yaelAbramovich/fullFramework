import { defineConfig, devices } from '@playwright/test';
import { environmentConfiguration, AUTH_STATE_PATH } from './src/config/environment';

/**
 * Playwright configuration — aligned with
 * https://playwright.dev/docs/best-practices
 *
 *   - fullyParallel: tests in a single file run in parallel by default
 *   - retries: only on CI (local failures should be investigated, not retried)
 *   - trace: captured on the first retry of a failed CI test (docs-recommended)
 *   - cross-browser: Chromium + Firefox + WebKit projects for the UI suite
 *
 * Authentication strategy:
 *   - The `setup` project runs first and saves session state to AUTH_STATE_PATH
 *   - All UI projects depend on `setup` and reuse that state (tests start logged in)
 *   - Tests that need a fresh unauthenticated browser add:
 *       test.use({ storageState: { cookies: [], origins: [] } })
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
      name: 'setup',
      testMatch: '**/auth/global.setup.ts',
    },
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ['setup'],
    },
    {
      name: 'ui-firefox',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Firefox'],
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ['setup'],
    },
    {
      name: 'ui-webkit',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Safari'],
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ['setup'],
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: environmentConfiguration.apiBaseUrl,
      },
    },
  ],
});
