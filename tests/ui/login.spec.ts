import { test } from '@playwright/test';
import { PageManager } from '../../src/infrastructure/PageManager';
import strings from '../../src/utils/strings.json';

test.describe('Login page — the-internet.herokuapp.com', () => {
  // These tests exercise the login form itself, so they need a fresh unauthenticated browser.
  // Remove this line in tests that should start already logged in.
  test.use({ storageState: { cookies: [], origins: [] } });

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
      strings.pages.loggedIn.successFlashMessageFragment,
    );
  });

  test('shows error message for invalid username', async () => {
    await pageManager.loginPageInstance().submitLoginFormWithCredentials(
      'incorrectUser',
      'SuperSecretPassword!',
    );

    await pageManager.loginPageInstance().assertFlashMessageContainsText(
      strings.pages.login.invalidUsernameError,
    );
  });

  test('shows error message for invalid password', async () => {
    await pageManager.loginPageInstance().submitLoginFormWithCredentials(
      'tomsmith',
      'wrongPassword',
    );

    await pageManager.loginPageInstance().assertFlashMessageContainsText(
      strings.pages.login.invalidPasswordError,
    );
  });
});
