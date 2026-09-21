import { test } from '../../src/infrastructure/fixtures';
import { assertResponseIsSuccessful, assertFieldEquals, assertFieldIsPresent } from '../../src/utils/apiAssertions';

test('GET /posts/:id returns the matching post', async ({ examplePostsApiClient }) => {
  const { response, post } = await examplePostsApiClient.getPostById(1);

  assertResponseIsSuccessful(response);
  assertFieldEquals(post.id, 1, 'post id');
  assertFieldIsPresent(post.title, 'post title');
});
