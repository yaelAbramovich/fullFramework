import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { resolveString } from '../utils/StringResolver';

export interface UserResource {
  id: number;
  name: string;
  username: string;
  email: string;
}

export class UsersApiClient extends BaseApiClient {
  public constructor(requestContext: APIRequestContext) {
    super(requestContext, 'UsersApiClient');
  }

  public async fetchAllUsers(): Promise<UserResource[]> {
    const collectionPath = resolveString('api.users.collectionPath');
    const apiResponse = await this.sendHttpRequest('GET', collectionPath);
    return this.parseResponseAsJson<UserResource[]>(apiResponse);
  }

  public async fetchSingleUserById(userId: number): Promise<UserResource> {
    const singleResourcePath = resolveString(
      'api.users.singleResourcePathTemplate',
      { userId },
    );
    const apiResponse = await this.sendHttpRequest('GET', singleResourcePath);
    return this.parseResponseAsJson<UserResource>(apiResponse);
  }

  public async requestSingleUserResponseById(userId: number): Promise<APIResponse> {
    const singleResourcePath = resolveString(
      'api.users.singleResourcePathTemplate',
      { userId },
    );
    return this.sendHttpRequest('GET', singleResourcePath);
  }
}
