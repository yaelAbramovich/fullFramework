import { APIRequestContext, APIResponse } from '@playwright/test';
import { Logger } from '../infrastructure/Logger';
import { resolveString } from '../utils/StringResolver';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestOptions {
  queryParameters?: Record<string, string | number | boolean>;
  requestHeaders?: Record<string, string>;
  jsonRequestBody?: unknown;
}

/**
 * BaseApiClient wraps Playwright's APIRequestContext and adds consistent
 * logging for every request and response. Concrete clients (e.g. UsersApiClient)
 * extend this class and expose endpoint-specific methods.
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
    this.logger.info(
      resolveString('logs.actions.sendingHttpRequest', {
        httpMethod,
        requestUrl: requestUrlPath,
      }),
    );

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
      resolveString('logs.actions.receivedHttpResponse', {
        statusCode: apiResponse.status(),
        requestUrl: requestUrlPath,
      }),
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
}
