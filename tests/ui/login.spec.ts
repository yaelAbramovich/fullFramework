import { test } from '@playwright/test';
import { PageManager } from '../../src/infrastructure/PageManager';
import { resolveString } from '../../src/utils/StringResolver';

test.describe('Login page — the-internet.herokuapp.com', () => {
  let pageManager: PageManager;

  test.beforeEach(async ({ page }) => {
    pageManager = new PageManager(page);
    await pageManager.loginPageInstance().openLoginPage();
    await pageManager.loginPageInstance().assertLoginFormIsVisible();
  });

  test('logs in successfully with valid credentials', async () => {
    await pageManager.loginPageInstance().submitLoginFormWithCredentials(
      'tomsmith',
      'SuperSecretPassword!',
    );

    await pageManager.loggedInSuccessPageInstance().assertSecureAreaHeadingIsVisible();
    await pageManager.loggedInSuccessPageInstance().assertLogoutButtonIsVisible();
    await pageManager.loginPageInstance().assertFlashMessageContainsText(
      resolveString('pages.loggedIn.successFlashMessageFragment'),
    );
  });

  test('shows error message for invalid username', async () => {
    await pageManager.loginPageInstance().submitLoginFormWithCredentials(
      'incorrectUser',
      'SuperSecretPassword!',
    );

    await pageManager.loginPageInstance().assertFlashMessageContainsText(
      resolveString('pages.login.errors.invalidUsername'),
    );
  });

  test('shows error message for invalid password', async () => {
    await pageManager.loginPageInstance().submitLoginFormWithCredentials(
      'tomsmith',
      'wrongPassword',
    );

    await pageManager.loginPageInstance().assertFlashMessageContainsText(
      resolveString('pages.login.errors.invalidPassword'),
    );
  });
});
