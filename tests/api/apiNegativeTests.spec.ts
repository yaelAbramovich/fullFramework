import { test, expect } from '@playwright/test';
import { CustomersApiClient } from '../../src/api/CustomersApiClient';
import { AccountsApiClient } from '../../src/api/AccountsApiClient';
import { environmentConfiguration } from '../../src/config/environment';

const NON_EXISTENT_CUSTOMER_ID = 99_999_999;
const NON_EXISTENT_ACCOUNT_ID = 99_999_999;

test.describe(
  'API negative tests',
  { tag: ['@apiNegative', '@negative', '@regression'] },
  () => {
    test('getCustomerId with credentials that do not exist throws HTTP 400 with "Invalid username and/or password"', async ({
      request,
    }) => {
      const customersApi = new CustomersApiClient(request);
      await expect(
        customersApi.getCustomerId('qa_nobody_xyz_does_not_exist_9999', 'wrong_password'),
        'Expected getCustomerId for non-existent credentials to throw HTTP 400 with parabank\'s "Invalid username and/or password" body',
      ).rejects.toThrow(/HTTP 400.*Invalid username and\/or password/s);
    });

    test('getAccounts with a customer id that does not exist throws HTTP 400 with "Could not find customer"', async ({
      playwright,
    }) => {
      const ctx = await playwright.request.newContext({
        baseURL: environmentConfiguration.apiBaseUrl,
        httpCredentials: {
          username: environmentConfiguration.validUsername,
          password: environmentConfiguration.validPassword,
        },
      });
      try {
        const accountsApi = new AccountsApiClient(ctx);
        await expect(
          accountsApi.getAccounts(NON_EXISTENT_CUSTOMER_ID),
          `Expected getAccounts for non-existent customer ${NON_EXISTENT_CUSTOMER_ID} to throw HTTP 400 with parabank's "Could not find customer #${NON_EXISTENT_CUSTOMER_ID}" body`,
        ).rejects.toThrow(
          new RegExp(`HTTP 400.*Could not find customer #${NON_EXISTENT_CUSTOMER_ID}`, 's'),
        );
      } finally {
        await ctx.dispose();
      }
    });

    test('getAccount with an account id that does not exist throws HTTP 400 with "Could not find account"', async ({
      playwright,
    }) => {
      const ctx = await playwright.request.newContext({
        baseURL: environmentConfiguration.apiBaseUrl,
        httpCredentials: {
          username: environmentConfiguration.validUsername,
          password: environmentConfiguration.validPassword,
        },
      });
      try {
        const accountsApi = new AccountsApiClient(ctx);
        await expect(
          accountsApi.getAccount(NON_EXISTENT_ACCOUNT_ID),
          `Expected getAccount for non-existent account ${NON_EXISTENT_ACCOUNT_ID} to throw HTTP 400 with parabank's "Could not find account #${NON_EXISTENT_ACCOUNT_ID}" body`,
        ).rejects.toThrow(
          new RegExp(`HTTP 400.*Could not find account #${NON_EXISTENT_ACCOUNT_ID}`, 's'),
        );
      } finally {
        await ctx.dispose();
      }
    });
  },
);
