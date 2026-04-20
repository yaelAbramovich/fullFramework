import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { Logger } from '../infrastructure/Logger';

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;
export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

export interface HttpRequestOptions {
  queryParameters?: Record<string, string | number | boolean>;
  requestHeaders?: Record<string, string>;
  jsonRequestBody?: unknown;
}

/**
 * BaseApiClient wraps Playwright's APIRequestContext and adds consistent
 * logging for every request and response, JSON parsing, and status-code
 * assertion helpers. Concrete clients (e.g. UsersApiClient) extend this
 * class and expose endpoint-specific methods.
 */
export abstract class BaseApiClient {
  protected readonly requestContext: APIRequestContext;
  protected readonly logger: Logger;

  protected constructor(requestContext: APIRequestContext, clientLoggerName: string) {
    this.requestContext = requestContext;
    this.logger = new Logger(clientLoggerName);
  }

  protected async sendHttpRequest(
    httpMethod: HttpMethod,
    requestUrlPath: string,
    requestOptions: HttpRequestOptions = {},
  ): Promise<APIResponse> {
    this.logger.info(`Sending ${httpMethod} request to: ${requestUrlPath}`);

    const playwrightRequestOptions = {
      params: requestOptions.queryParameters,
      headers: requestOptions.requestHeaders,
      data: requestOptions.jsonRequestBody,
    };

    const apiResponse = await this.requestContext.fetch(requestUrlPath, {
      method: httpMethod,
      ...playwrightRequestOptions,
    });

    this.logger.info(
      `Received HTTP ${apiResponse.status()} response from: ${requestUrlPath}`,
    );

    return apiResponse;
  }

  protected async parseResponseAsJson<TResponseBody>(
    apiResponse: APIResponse,
  ): Promise<TResponseBody> {
    const responseBodyText = await apiResponse.text();
    try {
      return JSON.parse(responseBodyText) as TResponseBody;
    } catch (parseError) {
      this.logger.error(
        `Failed to parse response body as JSON. Raw body: ${responseBodyText}`,
        parseError,
      );
      throw parseError;
    }
  }

  protected async assertResponseStatusIs(
    apiResponse: APIResponse,
    expectedStatusCode: number,
    requestDescription: string,
  ): Promise<void> {
    this.logger.debug(
      `Asserting ${requestDescription} returned HTTP ${expectedStatusCode}`,
    );
    expect(
      apiResponse.status(),
      `Expected ${requestDescription} to return HTTP ${expectedStatusCode} but got HTTP ${apiResponse.status()}`,
    ).toBe(expectedStatusCode);
  }

  protected async assertResponseStatusIsOk(
    apiResponse: APIResponse,
    requestDescription: string,
  ): Promise<void> {
    this.logger.debug(`Asserting ${requestDescription} returned a 2xx status`);
    await expect(
      apiResponse,
      `Expected ${requestDescription} to return a 2xx status but got HTTP ${apiResponse.status()}`,
    ).toBeOK();
  }
}
