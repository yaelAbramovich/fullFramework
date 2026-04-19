import { test as base } from '../../src/infrastructure/fixtures';
import { UsersApiClient } from '../../src/api/UsersApiClient';

/**
 * API-suite-local fixtures. Kept next to the API specs (not in the global
 * fixtures module) because they are only useful to tests under `tests/api/`
 * — a UI test has no reason to pay for an APIRequestContext-backed client.
 *
 * Extends the global `test` so these API specs still get everything the
 * global fixtures expose (currently `pageManager`, which is lazily
 * instantiated and costs nothing when unused).
 */
interface ApiTestFixtures {
  usersApiClient: UsersApiClient;
}

export const test = base.extend<ApiTestFixtures>({
  usersApiClient: async ({ request }, use) => {
    await use(new UsersApiClient(request));
  },
});

export { expect } from '../../src/infrastructure/fixtures';
