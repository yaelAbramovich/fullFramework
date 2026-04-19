import { test as base } from '@playwright/test';
import { PageManager } from './PageManager';

/**
 * Global Playwright fixtures — everything that is broadly useful across the
 * whole test tree lives here. Tests (or suite-local fixture files) import
 * `test` from this module and extend it further when they need fixtures
 * that are only meaningful to a subset of tests.
 *
 * Playwright lazily instantiates each fixture the first time a test's
 * parameter list references it, so unused fixtures cost nothing.
 *
 * To add a global fixture:
 *   1. Add its type to `TestFixtures`.
 *   2. Add the factory under `.extend<TestFixtures>({ ... })`.
 *
 * To add a fixture that's only relevant to one suite (e.g. an API client
 * only the API specs need), do NOT add it here — create a suite-local
 * fixture file (see `tests/api/fixtures.ts`) that extends this `test`.
 *
 * Scope: fixtures default to test-scoped (fresh instance per test), which
 * matches `page` — Playwright's built-in fixture we wrap is also
 * test-scoped, so construction stays aligned with the browser lifecycle.
 */
export interface TestFixtures {
  pageManager: PageManager;
}

export const test = base.extend<TestFixtures>({
  pageManager: async ({ page }, use) => {
    await use(new PageManager(page));
  },
});

export { expect } from '@playwright/test';
