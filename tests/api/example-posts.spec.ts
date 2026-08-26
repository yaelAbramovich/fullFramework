import { APIRequestContext, APIResponse } from '@playwright/test';
import { test, expect } from '../../src/infrastructure/fixtures';
import { BaseApiClient, HttpMethod } from '../../src/api/BaseApiClient';

interface Post {
  id: number;
  title: string;
}

/**
 * Minimal concrete API client demonstrating BaseApiClient against
 * jsonplaceholder.typicode.com. Local to this example test, not part of
 * the reusable src/api framework.
 */
class ExamplePostsApiClient extends BaseApiClient {
  private static readonly POSTS_COLLECTION_PATH = '/posts';

  public constructor(requestContext: APIRequestContext) {
    super(requestContext, 'ExamplePostsApiClient');
  }

  public async getPostById(postId: number): Promise<{ response: APIResponse; post: Post }> {
    const response = await this.sendHttpRequest(
      HttpMethod.GET,
      ExamplePostsApiClient.singlePostPath(postId),
    );
    const post = await this.parseResponseAsJson<Post>(response);
    return { response, post };
  }

  private static singlePostPath(postId: number): string {
    return `${ExamplePostsApiClient.POSTS_COLLECTION_PATH}/${postId}`;
  }
}

test('GET /posts/:id returns the matching post', async ({ request }) => {
  const client = new ExamplePostsApiClient(request);

  const { response, post } = await client.getPostById(1);

  expect(response.ok()).toBeTruthy();
  expect(post.id).toBe(1);
  expect(post.title).toBeTruthy();
});
