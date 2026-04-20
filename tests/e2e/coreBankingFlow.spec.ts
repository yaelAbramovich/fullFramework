import { test, expect } from '../../src/infrastructure/fixtures';
import { CustomersApiClient } from '../../src/api/CustomersApiClient';
import { AccountsApiClient } from '../../src/api/AccountsApiClient';
import { environmentConfiguration } from '../../src/config/environment';
import { buildFakeRegistrationFormData } from '../../src/utils/testData/registrationFormDataBuilder';

test.describe('Core banking E2E flow', () => {
  test('register, get customer id, get existing account', async ({
    pageManager,
    playwright,
  }) => {
    const formData = buildFakeRegistrationFormData();

    await test.step('register a new user via UI', async () => {
      await pageManager.registerPageInstance().goto();
      await pageManager.registerPageInstance().assertSigningUpSectionIsDisplayed();
      await pageManager.registerPageInstance().fillFormAndRegister(formData);
      await pageManager.welcomePageInstance().assertSuccessfulRegistration(formData.username);
    });

    const apiRequestContext = await playwright.request.newContext({
      baseURL: environmentConfiguration.apiBaseUrl,
      httpCredentials: { username: formData.username, password: formData.password },
    });

    try {
      const customerId = await test.step('get customer id via API', async () => {
        const customersApi = new CustomersApiClient(apiRequestContext);
        const fetchedCustomerId = await customersApi.getCustomerId(
          formData.username,
          formData.password,
        );
        expect(
          fetchedCustomerId,
          `Expected customer id for "${formData.username}" to be a positive number`,
        ).toBeGreaterThan(0);
        return fetchedCustomerId;
      });

      await test.step('get existing account via API', async () => {
        const accountsApi = new AccountsApiClient(apiRequestContext);
        const accounts = await accountsApi.getAccounts(customerId);
        expect(
          accounts.length,
          `Expected customer ${customerId} to own at least one existing account`,
        ).toBeGreaterThan(0);
        const existingAccount = accounts[0];
        expect(
          existingAccount.customerId,
          `Expected account #${existingAccount.id} to belong to customer ${customerId}`,
        ).toBe(customerId);
        expect(
          existingAccount.balance,
          `Expected account #${existingAccount.id} balance to be a non-negative number`,
        ).toBeGreaterThanOrEqual(0);
      });
    } finally {
      await apiRequestContext.dispose();
    }
  });
});
