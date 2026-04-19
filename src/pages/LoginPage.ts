import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { resolveString } from '../utils/StringResolver';

export class LoginPage extends BasePage {
  private readonly usernameInputLocator: Locator;
  private readonly passwordInputLocator: Locator;
  private readonly submitButtonLocator: Locator;

  public constructor(page: Page) {
    super(page, 'LoginPage');

    this.usernameInputLocator = this.page
      .getByLabel(resolveString('pages.login.usernameFieldLabel'))
      .describe('Username input field');
    this.passwordInputLocator = this.page
      .getByLabel(resolveString('pages.login.passwordFieldLabel'))
      .describe('Password input field');
    this.submitButtonLocator = this.page
      .getByRole('button', {
        name: resolveString('pages.login.submitButtonAccessibleName'),
      })
      .describe('Login submit button');
  }

  public async openLoginPage(): Promise<void> {
    const loginUrlPath = resolveString('pages.login.urlPath');
    await this.navigateToUrlPath(loginUrlPath);
    // No explicit wait needed — subsequent actions auto-wait for the element
    // to be actionable. If a test wants to verify the page is ready, it can
    // call assertLoginFormIsVisible() which uses a web-first assertion.
  }

  public async assertLoginFormIsVisible(): Promise<void> {
    await this.assertElementIsVisible(
      this.usernameInputLocator,
      'Username input field',
    );
    await this.assertElementIsVisible(
      this.passwordInputLocator,
      'Password input field',
    );
    await this.assertElementIsVisible(
      this.submitButtonLocator,
      'Login submit button',
    );
  }

  public async fillUsernameField(username: string): Promise<void> {
    await this.fillElementWithText(
      this.usernameInputLocator,
      username,
      'Username input field',
    );
  }

  public async fillPasswordField(password: string): Promise<void> {
    await this.fillElementWithText(
      this.passwordInputLocator,
      password,
      'Password input field',
    );
  }

  public async clickLoginSubmitButton(): Promise<void> {
    await this.clickOnElement(this.submitButtonLocator, 'Login submit button');
  }

  public async submitLoginFormWithCredentials(
    username: string,
    password: string,
  ): Promise<void> {
    await this.fillUsernameField(username);
    await this.fillPasswordField(password);
    await this.clickLoginSubmitButton();
  }

  public async assertFlashMessageContainsText(
    expectedTextFragment: string,
  ): Promise<void> {
    const flashMessageLocator = this.page
      .getByText(expectedTextFragment)
      .describe(`Flash message containing "${expectedTextFragment}"`);
    await this.assertElementIsVisible(
      flashMessageLocator,
      `Flash message containing "${expectedTextFragment}"`,
    );
  }
}
