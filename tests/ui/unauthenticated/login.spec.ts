import { test } from '../../../src/infrastructure/fixtures';
import strings from '../../../src/utils/strings.json';

test.describe('Login page — the-internet.herokuapp.com', () => {
  test.beforeEach(async ({ pageManager }) => {
    await pageManager.loginPageInstance().openLoginPage();
    await pageManager.loginPageInstance().assertLoginFormIsVisible();
  });

  test('logs in successfully with valid credentials', async ({ pageManager }) => {
    await pageManager.loginPageInstance().submitLoginFormWithCredentials(
      'tomsmith',
      'SuperSecretPassword!',
    );

    await pageManager.loggedInSuccessPageInstance().assertSecureAreaHeadingIsVisible();
    await pageManager.loggedInSuccessPageInstance().assertLogoutButtonIsVisible();
    await pageManager.loginPageInstance().assertFlashMessageContainsText(
      strings.pages.loggedIn.successFlashMessageFragment,
    );
  });

  test('shows error message for invalid username', async ({ pageManager }) => {
    await pageManager.loginPageInstance().submitLoginFormWithCredentials(
      'incorrectUser',
      'SuperSecretPassword!',
    );

    await pageManager.loginPageInstance().assertFlashMessageContainsText(
      strings.pages.login.invalidUsernameError,
    );
  });

  test('shows error message for invalid password', async ({ pageManager }) => {
    await pageManager.loginPageInstance().submitLoginFormWithCredentials(
      'tomsmith',
      'wrongPassword',
    );

    await pageManager.loginPageInstance().assertFlashMessageContainsText(
      strings.pages.login.invalidPasswordError,
    );
  });
});
