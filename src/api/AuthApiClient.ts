import { APIRequestContext, APIResponse } from '@playwright/test';
import { ShopApiClient } from './ShopApiClient';
import { HttpMethod } from './BaseApiClient';

export interface LoginResult {
  accessToken?: string;
  refreshToken?: string;
  id?: number;
  username?: string;
  email?: string;
  message?: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
}

export class AuthApiClient extends ShopApiClient {
  private static readonly LOGIN_PATH = '/auth/login';
  private static readonly CURRENT_USER_PATH = '/auth/me';

  public constructor(requestContext: APIRequestContext) {
    super(requestContext, 'AuthApiClient');
  }

  public async login(
    username: string,
    password: string,
  ): Promise<{ response: APIResponse; loginResult: LoginResult }> {
    const response = await this.sendHttpRequest(
      HttpMethod.POST,
      this.buildShopApiUrl(AuthApiClient.LOGIN_PATH),
      { jsonRequestBody: { username, password } },
    );
    const loginResult = await this.parseResponseAsJson<LoginResult>(response);
    return { response, loginResult };
  }

  public async getCurrentUser(
    accessToken: string,
  ): Promise<{ response: APIResponse; user: CurrentUser }> {
    const response = await this.sendHttpRequest(
      HttpMethod.GET,
      this.buildShopApiUrl(AuthApiClient.CURRENT_USER_PATH),
      { requestHeaders: { Authorization: `Bearer ${accessToken}` } },
    );
    const user = await this.parseResponseAsJson<CurrentUser>(response);
    return { response, user };
  }
}
