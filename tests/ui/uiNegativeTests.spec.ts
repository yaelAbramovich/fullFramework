import { test } from '../../src/infrastructure/fixtures';
import { environmentConfiguration } from '../../src/config/environment';

test.describe(
  'UI negative tests',
  { tag: ['@uiNegative', '@negative', '@regression'] },
  () => {
    test('registration with only one field filled shows the "Last name is required." error', async ({
      pageManager,
    }) => {
      await pageManager.registerPageInstance().gotoRegisterPage();
      await pageManager.registerPageInstance().assertSigningUpSectionIsDisplayed();
      await pageManager.registerPageInstance().fillFormAndRegister({ firstName: 'Solo' });
      await pageManager.registerPageInstance().assertLastNameRequiredErrorIsVisible();
    });

    test('login with a non-existent user shows a login-failed error message', async ({
      pageManager,
    }) => {
      const nonExistentUsername = 'qa_nobody_xyz_does_not_exist_9999';
      const arbitraryPassword = 'wrong_password_value';
      await pageManager.loginPageInstance().gotoLoginPage();
      await pageManager
        .loginPageInstance()
        .fillDetailsAndLogin(nonExistentUsername, arbitraryPassword);
      await pageManager.loginPageInstance().assertLoginErrorMessageIsVisible();
    });

    [
      { label: 'empty', amount: '' },
      { label: 'negative', amount: '-1' },
    ].forEach(({ label, amount }) => {
      test(`transfer with a ${label} amount shows the generic error message`, async ({
        pageManager,
      }) => {
        await pageManager.loginPageInstance().gotoLoginPage();
        await pageManager
          .loginPageInstance()
          .fillDetailsAndLogin(
            environmentConfiguration.validUsername,
            environmentConfiguration.validPassword,
          );
        await pageManager.transferFundsPageInstance().gotoTransferFundsPage();
        await pageManager.transferFundsPageInstance().assertFormHeadingIsVisible();
        await pageManager.transferFundsPageInstance().fillAmount(amount);
        await pageManager.transferFundsPageInstance().clickTransfer();
        await pageManager.transferFundsPageInstance().assertGenericErrorMessageIsVisible();
      });
    });
  },
);
