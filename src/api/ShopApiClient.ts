import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { environmentConfiguration } from '../config/environment';

/**
 * Shared base for every client that talks to the shop API
 * (environmentConfiguration.shopApiBaseUrl). Concrete clients build request
 * paths with buildShopApiUrl so the base URL lookup lives in one place.
 */
export abstract class ShopApiClient extends BaseApiClient {
  protected constructor(requestContext: APIRequestContext, clientLoggerName: string) {
    super(requestContext, clientLoggerName);
  }

  protected buildShopApiUrl(urlPath: string): string {
    return `${environmentConfiguration.shopApiBaseUrl}${urlPath}`;
  }
}
