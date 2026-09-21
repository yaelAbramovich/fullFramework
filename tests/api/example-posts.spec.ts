import { test, expect } from '../../src/infrastructure/fixtures';

test('GET /posts/:id returns the matching post', async ({ examplePostsApiClient }) => {
  const { response, post } = await examplePostsApiClient.getPostById(1);

  expect(response.ok()).toBeTruthy();
  expect(post.id).toBe(1);
  expect(post.title).toBeTruthy();
});
