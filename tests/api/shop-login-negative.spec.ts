import { test } from '../../src/infrastructure/fixtures';
import { assertResponseHasStatus, assertFieldEquals } from '../../src/utils/apiAssertions';

const INVALID_USERNAME = 'invalid_user';
const INVALID_PASSWORD = 'wrong-password';

test('POST /auth/login returns 400 and an error message for invalid credentials', async ({
  authApiClient,
}) => {
  const { response, loginResult } = await authApiClient.login(INVALID_USERNAME, INVALID_PASSWORD);

  assertResponseHasStatus(response, 400, 'login response status');
  assertFieldEquals(loginResult.message, 'Invalid credentials', 'login error message');
});
