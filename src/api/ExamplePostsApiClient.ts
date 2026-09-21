import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient, HttpMethod } from './BaseApiClient';

export interface Post {
  id: number;
  title: string;
}

export class ExamplePostsApiClient extends BaseApiClient {
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
