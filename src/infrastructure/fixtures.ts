import { test as base } from '@playwright/test';
import { UsersApiClient } from '../api/UsersApiClient';

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
 * is correct for `request`-backed API clients — Playwright's APIRequestContext
 * is itself test-scoped.
 */
export interface TestFixtures {
  usersApiClient: UsersApiClient;
}

export const test = base.extend<TestFixtures>({
  usersApiClient: async ({ request }, use) => {
    await use(new UsersApiClient(request));
  },
});

export { expect } from '@playwright/test';
