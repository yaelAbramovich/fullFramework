import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class LoginPage extends BasePage {
  private readonly usernameInputLocator: Locator;
  private readonly passwordInputLocator: Locator;
  private readonly submitButtonLocator: Locator;

  public constructor(page: Page) {
    super(page, 'LoginPage');

    this.usernameInputLocator = this.page
      .getByLabel(strings.pages.login.usernameFieldLabel)
      .describe(strings.pages.login.descriptions.usernameField);
    this.passwordInputLocator = this.page
      .getByLabel(strings.pages.login.passwordFieldLabel)
      .describe(strings.pages.login.descriptions.passwordField);
    this.submitButtonLocator = this.page
      .getByRole('button', { name: strings.pages.login.submitButtonAccessibleName })
      .describe(strings.pages.login.descriptions.submitButton);
  }

  public async openLoginPage(): Promise<void> {
    await this.navigateToUrlPath(strings.pages.login.urlPath);
  }

  public async assertLoginFormIsVisible(): Promise<void> {
    await this.assertElementIsVisible(
      this.usernameInputLocator,
      strings.pages.login.descriptions.usernameField,
    );
    await this.assertElementIsVisible(
      this.passwordInputLocator,
      strings.pages.login.descriptions.passwordField,
    );
    await this.assertElementIsVisible(
      this.submitButtonLocator,
      strings.pages.login.descriptions.submitButton,
    );
  }

  public async fillUsernameField(username: string): Promise<void> {
    await this.fillElementWithText(
      this.usernameInputLocator,
      username,
      strings.pages.login.descriptions.usernameField,
    );
  }

  public async fillPasswordField(password: string): Promise<void> {
    await this.fillElementWithText(
      this.passwordInputLocator,
      password,
      strings.pages.login.descriptions.passwordField,
    );
  }

  public async clickLoginSubmitButton(): Promise<void> {
    await this.clickOnElement(
      this.submitButtonLocator,
      strings.pages.login.descriptions.submitButton,
    );
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
    const flashMessageDescription =
      strings.pages.login.descriptions.flashMessageWithFragment.replace(
        '{fragment}',
        expectedTextFragment,
      );
    const flashMessageLocator = this.page
      .getByText(expectedTextFragment)
      .describe(flashMessageDescription);
    await this.assertElementIsVisible(flashMessageLocator, flashMessageDescription);
  }
}
