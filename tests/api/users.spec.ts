import { test, expect } from '@playwright/test';
import { UsersApiClient } from '../../src/api/UsersApiClient';

test.describe('Users API — jsonplaceholder.typicode.com', () => {
  test('returns a non-empty list of users', async ({ request }) => {
    const usersApiClient = new UsersApiClient(request);

    const allUsers = await usersApiClient.fetchAllUsers();

    expect(allUsers.length).toBeGreaterThan(0);
    expect(allUsers[0]).toHaveProperty('id');
    expect(allUsers[0]).toHaveProperty('email');
  });

  test('returns a single user by id', async ({ request }) => {
    const usersApiClient = new UsersApiClient(request);
    const expectedUserId = 1;

    const singleUser = await usersApiClient.fetchSingleUserById(expectedUserId);

    expect(singleUser.id).toBe(expectedUserId);
    expect(typeof singleUser.name).toBe('string');
    expect(singleUser.email).toMatch(/@/);
  });

  test('returns HTTP 404 for a non-existent user id', async ({ request }) => {
    const usersApiClient = new UsersApiClient(request);
    const nonExistentUserId = 999_999;

    const apiResponse =
      await usersApiClient.requestSingleUserResponseById(nonExistentUserId);

    expect(apiResponse.status()).toBe(404);
  });
});
