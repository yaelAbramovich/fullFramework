import { test as base } from '@playwright/test';
import { ExamplePostsApiClient } from '../api/ExamplePostsApiClient';
import { AuthApiClient } from '../api/AuthApiClient';
import { ProductsApiClient } from '../api/ProductsApiClient';
import { CartsApiClient } from '../api/CartsApiClient';
import { ExampleLoginPage } from '../pages/ExampleLoginPage';

/**
 * Global Playwright fixtures — everything that is broadly useful across the
 * whole test tree lives here. Tests (or suite-local fixture files) import
 * `test` from this module and extend it further when they need fixtures
 * that are only meaningful to a subset of tests.
 *
 * Playwright lazily instantiates each fixture the first time a test's
 * parameter list references it, so unused fixtures cost nothing.
 *
 * To add a global fixture (e.g. a POM or API client):
 *   1. Add its type to `TestFixtures`.
 *   2. Add the factory under `.extend<TestFixtures>({ ... })`.
 *
 * Scope: fixtures default to test-scoped (fresh instance per test), which
 * matches `page`/`request` — Playwright's built-in fixtures we wrap are also
 * test-scoped, so construction stays aligned with the browser/request
 * lifecycle.
 */
export interface TestFixtures {
  examplePostsApiClient: ExamplePostsApiClient;
  authApiClient: AuthApiClient;
  productsApiClient: ProductsApiClient;
  cartsApiClient: CartsApiClient;
  exampleLoginPage: ExampleLoginPage;
}

export const test = base.extend<TestFixtures>({
  examplePostsApiClient: async ({ request }, use) => {
    await use(new ExamplePostsApiClient(request));
  },
  authApiClient: async ({ request }, use) => {
    await use(new AuthApiClient(request));
  },
  productsApiClient: async ({ request }, use) => {
    await use(new ProductsApiClient(request));
  },
  cartsApiClient: async ({ request }, use) => {
    await use(new CartsApiClient(request));
  },
  exampleLoginPage: async ({ page }, use) => {
    await use(new ExampleLoginPage(page));
  },
});

export { expect } from '@playwright/test';
