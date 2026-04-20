import { APIRequestContext } from '@playwright/test';
import { BaseApiClient, HttpMethod } from './BaseApiClient';

export type AccountType = 'CHECKING' | 'SAVINGS' | 'LOAN';

export interface Account {
  id: number;
  customerId: number;
  type: AccountType;
  balance: number;
}

export class AccountsApiClient extends BaseApiClient {
  private static accountPath(accountId: number): string {
    return `accounts/${accountId}`;
  }

  private static customerAccountsPath(customerId: number): string {
    return `customers/${customerId}/accounts`;
  }

  public constructor(requestContext: APIRequestContext) {
    super(requestContext, 'AccountsApiClient');
  }

  public async getAccounts(customerId: number): Promise<Account[]> {
    const requestDescription = `GET /customers/${customerId}/accounts`;
    const apiResponse = await this.sendHttpRequest(
      HttpMethod.GET,
      AccountsApiClient.customerAccountsPath(customerId),
      { requestHeaders: { Accept: 'application/json' } },
    );
    await this.assertResponseStatusIs(apiResponse, 200, requestDescription);
    return await this.parseResponseAsJson<Account[]>(apiResponse);
  }

  public async getAccount(accountId: number): Promise<Account> {
    const requestDescription = `GET /accounts/${accountId}`;
    const apiResponse = await this.sendHttpRequest(
      HttpMethod.GET,
      AccountsApiClient.accountPath(accountId),
      { requestHeaders: { Accept: 'application/json' } },
    );
    await this.assertResponseStatusIs(apiResponse, 200, requestDescription);
    return await this.parseResponseAsJson<Account>(apiResponse);
  }
}
