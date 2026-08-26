import { test as base } from '@playwright/test';

/**
 * Global Playwright fixtures — everything that is broadly useful across the
 * whole test tree lives here. Tests (or suite-local fixture files) import
 * `test` from this module and extend it further when they need fixtures
 * that are only meaningful to a subset of tests.
 *
 * Playwright lazily instantiates each fixture the first time a test's
 * parameter list references it, so unused fixtures cost nothing.
 *
 * To add a global fixture (e.g. a POM):
 *   1. Add its type to `TestFixtures`.
 *   2. Add the factory under `.extend<TestFixtures>({ ... })`.
 *
 * Empty for now — no concrete page objects are checked in yet. See
 * `tests/ui/example-login.spec.ts` for how a page object is used before
 * it's promoted to a real framework fixture here.
 *
 * Scope: fixtures default to test-scoped (fresh instance per test), which
 * matches `page` — Playwright's built-in fixture we wrap is also
 * test-scoped, so construction stays aligned with the browser lifecycle.
 */
export interface TestFixtures {}

export const test = base.extend<TestFixtures>({});

export { expect } from '@playwright/test';
