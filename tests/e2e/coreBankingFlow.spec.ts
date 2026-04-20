import { test } from '../../src/infrastructure/fixtures';
import { CustomersApiClient } from '../../src/api/CustomersApiClient';
import { AccountsApiClient } from '../../src/api/AccountsApiClient';
import { environmentConfiguration } from '../../src/config/environment';
import { buildFakeRegistrationFormData } from '../../src/utils/testData/registrationFormDataBuilder';
import { createAccountViaCurl } from '../../src/utils/createAccountViaCurl';
import { expectCustomerIdToBeValid } from '../../src/utils/validations/customerValidations';
import {
  expectAccountBalanceToBeNonNegative,
  expectAccountIdToBePositive,
  expectAccountIdToDifferFrom,
  expectAccountsToIncludeAtLeastOne,
  expectAccountToBelongToCustomer,
  expectAccountTypeToBe,
} from '../../src/utils/validations/accountValidations';
import { expectAccountBalanceToHaveChangedBy } from '../../src/utils/validations/transferValidations';

test.describe('Core banking E2E flow', { tag: ['@e2e', '@smoke', '@regression'] }, () => {
  test('register, get customer id, get existing account, create new CHECKING via curl, verify in UI, transfer funds, validate balances, logout', async ({
    pageManager,
    playwright,
  }) => {
    const formData = buildFakeRegistrationFormData();

    await test.step('register a new user via UI', async () => {
      await pageManager.registerPageInstance().gotoRegisterPage();
      await pageManager.registerPageInstance().assertSigningUpSectionIsDisplayed();
      await pageManager.registerPageInstance().fillFormAndRegister(formData);
      await pageManager.welcomePageInstance().assertSuccessfulRegistration(formData.username);
    });

    const apiRequestContext = await playwright.request.newContext({
      baseURL: environmentConfiguration.apiBaseUrl,
      httpCredentials: { username: formData.username, password: formData.password },
    });
    const customersApi = new CustomersApiClient(apiRequestContext);
    const accountsApi = new AccountsApiClient(apiRequestContext);

    try {
      const customerId = await test.step('get customer id via API', async () => {
        const fetchedCustomerId = await customersApi.getCustomerId(
          formData.username,
          formData.password,
        );
        expectCustomerIdToBeValid(fetchedCustomerId);
        return fetchedCustomerId;
      });

      const existingAccount = await test.step('get existing account via API', async () => {
        const accounts = await accountsApi.getAccounts(customerId);
        expectAccountsToIncludeAtLeastOne(accounts, customerId);
        const firstAccount = accounts[0];
        expectAccountToBelongToCustomer(firstAccount, customerId);
        expectAccountBalanceToBeNonNegative(firstAccount);
        return firstAccount;
      });

      const newAccount = await test.step('create a new CHECKING account via curl', async () => {
        const createdAccount = await createAccountViaCurl({
          customerId,
          newAccountType: 'CHECKING',
          fromAccountId: existingAccount.id,
          credentials: { username: formData.username, password: formData.password },
        });
        expectAccountIdToBePositive(createdAccount);
        expectAccountIdToDifferFrom(createdAccount, existingAccount.id);
        expectAccountToBelongToCustomer(createdAccount, customerId);
        expectAccountTypeToBe(createdAccount, 'CHECKING');
        return createdAccount;
      });

      await test.step('verify new account appears on the Accounts Overview page', async () => {
        await pageManager.accountsOverviewPageInstance().gotoAccountsOverviewPage();
        await pageManager.accountsOverviewPageInstance().assertPageHeadingIsVisible();
        await pageManager.accountsOverviewPageInstance().assertAccountRowIsVisible(newAccount.id);
      });

      const transferContext = await test.step(
        'transfer money from existing account to new account via UI',
        async () => {
          const transferAmountUsd = 25;
          const sourceBalanceBefore = (await accountsApi.getAccount(existingAccount.id)).balance;
          const destinationBalanceBefore = (await accountsApi.getAccount(newAccount.id)).balance;

          await pageManager.transferFundsPageInstance().gotoTransferFundsPage();
          await pageManager.transferFundsPageInstance().assertFormHeadingIsVisible();
          await pageManager
            .transferFundsPageInstance()
            .transferAmount(transferAmountUsd, existingAccount.id, newAccount.id);
          await pageManager.transferFundsPageInstance().assertTransferCompleteHeadingIsVisible();

          return { transferAmountUsd, sourceBalanceBefore, destinationBalanceBefore };
        },
      );

      await test.step('validate updated balances via API', async () => {
        const sourceAccountAfter = await accountsApi.getAccount(existingAccount.id);
        const destinationAccountAfter = await accountsApi.getAccount(newAccount.id);
        expectAccountBalanceToHaveChangedBy(
          sourceAccountAfter,
          transferContext.sourceBalanceBefore,
          -transferContext.transferAmountUsd,
        );
        expectAccountBalanceToHaveChangedBy(
          destinationAccountAfter,
          transferContext.destinationBalanceBefore,
          +transferContext.transferAmountUsd,
        );
      });

      await test.step('logout via UI', async () => {
        await pageManager.loggedInNavPageInstance().clickLogout();
        await pageManager.loginPageInstance().assertLoginButtonIsVisible();
      });
    } finally {
      await apiRequestContext.dispose();
    }
  });
});
