import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient, HttpMethod } from './BaseApiClient';

export interface UserResource {
  id: number;
  name: string;
  username: string;
  email: string;
}

export class UsersApiClient extends BaseApiClient {
  private static readonly USERS_COLLECTION_PATH = '/users';

  public constructor(requestContext: APIRequestContext) {
    super(requestContext, 'UsersApiClient');
  }

  public async fetchAllUsers(): Promise<UserResource[]> {
    const apiResponse = await this.sendHttpRequest(
      HttpMethod.GET,
      UsersApiClient.USERS_COLLECTION_PATH,
    );
    return this.parseResponseAsJson<UserResource[]>(apiResponse);
  }

  public async fetchSingleUserById(userId: number): Promise<UserResource> {
    const apiResponse = await this.sendHttpRequest(
      HttpMethod.GET,
      UsersApiClient.singleUserPath(userId),
    );
    return this.parseResponseAsJson<UserResource>(apiResponse);
  }

  public async requestSingleUserResponseById(userId: number): Promise<APIResponse> {
    return this.sendHttpRequest(HttpMethod.GET, UsersApiClient.singleUserPath(userId));
  }

  private static singleUserPath(userId: number): string {
    return `${UsersApiClient.USERS_COLLECTION_PATH}/${userId}`;
  }
}
