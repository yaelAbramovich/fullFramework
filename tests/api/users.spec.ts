import { test, expect } from './fixtures';

test.describe('Users API — jsonplaceholder.typicode.com', () => {
  test('returns a non-empty list of users', async ({ usersApiClient }) => {
    const allUsers = await usersApiClient.fetchAllUsers();

    expect(allUsers.length).toBeGreaterThan(0);
    expect(allUsers[0]).toHaveProperty('id');
    expect(allUsers[0]).toHaveProperty('email');
  });

  test('returns a single user by id', async ({ usersApiClient }) => {
    const expectedUserId = 1;

    const singleUser = await usersApiClient.fetchSingleUserById(expectedUserId);

    expect(singleUser.id).toBe(expectedUserId);
    expect(typeof singleUser.name).toBe('string');
    expect(singleUser.email).toMatch(/@/);
  });

  test('returns HTTP 404 for a non-existent user id', async ({ usersApiClient }) => {
    const nonExistentUserId = 999_999;

    const apiResponse =
      await usersApiClient.requestSingleUserResponseById(nonExistentUserId);

    expect(apiResponse.status()).toBe(404);
  });
});
