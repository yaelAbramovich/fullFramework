import { test as base } from '@playwright/test';
import { UsersApiClient } from '../api/UsersApiClient';
import { PageManager } from './PageManager';

/**
 * Custom Playwright fixtures. Tests import `test` and `expect` from here
 * instead of `@playwright/test` — Playwright lazily instantiates each
 * fixture the first time a test's parameter list references it, so unused
 * fixtures cost nothing.
 *
 * To add a fixture:
 *   1. Add its type to `TestFixtures`.
 *   2. Add the factory under `.extend<TestFixtures>({ ... })`.
 *
 * Scope: fixtures default to test-scoped (fresh instance per test), which
 * matches `request` (APIRequestContext) and `page` (Page) — Playwright's
 * built-in fixtures these wrap are also test-scoped, so construction stays
 * aligned with the browser / request lifecycle.
 */
export interface TestFixtures {
  usersApiClient: UsersApiClient;
  pageManager: PageManager;
}

export const test = base.extend<TestFixtures>({
  usersApiClient: async ({ request }, use) => {
    await use(new UsersApiClient(request));
  },
  pageManager: async ({ page }, use) => {
    await use(new PageManager(page));
  },
});

export { expect } from '@playwright/test';
