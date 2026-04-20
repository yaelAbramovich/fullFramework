import { APIRequestContext } from '@playwright/test';
import { BaseApiClient, HttpMethod } from './BaseApiClient';

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  address: CustomerAddress;
  phoneNumber: string;
  ssn: string;
}

export class CustomersApiClient extends BaseApiClient {
  private static loginPath(username: string, password: string): string {
    return `login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`;
  }

  public constructor(requestContext: APIRequestContext) {
    super(requestContext, 'CustomersApiClient');
  }

  public async login(username: string, password: string): Promise<Customer> {
    const apiResponse = await this.sendHttpRequest(
      HttpMethod.GET,
      CustomersApiClient.loginPath(username, password),
      { requestHeaders: { Accept: 'application/json' } },
    );
    await this.assertResponseStatusIs(apiResponse, 200, `GET /login for username "${username}"`);
    return await this.parseResponseAsJson<Customer>(apiResponse);
  }

  public async getCustomerId(username: string, password: string): Promise<number> {
    const customer = await this.login(username, password);
    return customer.id;
  }
}
