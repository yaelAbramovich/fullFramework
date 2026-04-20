import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class LoginPage extends BasePage {
  private static readonly loginEndpoint = '/parabank/index.htm';

  private readonly usernameField: Locator;
  private readonly passwordField: Locator;
  private readonly loginButton: Locator;
  private readonly loginErrorMessage: Locator;

  public constructor(page: Page) {
    super(page, 'LoginPage');

    this.usernameField = this.page
      .getByRole('textbox')
      .first()
      .describe('Username field');

    this.passwordField = this.page
      .getByRole('textbox')
      .nth(1)
      .describe('Password field');

    this.loginButton = this.page
      .getByRole('button', { name: strings.pages.login.loginButtonAccessibleName })
      .describe('Log In button');

    this.loginErrorMessage = this.page
      .getByText(strings.pages.login.invalidCredentialsErrorText, { exact: true })
      .or(
        this.page.getByText(strings.pages.login.genericInternalErrorText, { exact: true }),
      )
      .describe('Login failed error message');
  }

  public async gotoLoginPage(): Promise<void> {
    await this.navigateToUrlPath(LoginPage.loginEndpoint);
  }

  public async fillUsername(username: string): Promise<void> {
    await this.fillElementWithText(this.usernameField, username, 'Username field');
  }

  public async fillPassword(password: string): Promise<void> {
    await this.fillElementWithText(this.passwordField, password, 'Password field');
  }

  public async clickLogin(): Promise<void> {
    await this.clickOnElement(this.loginButton, 'Log In button');
  }

  public async fillDetailsAndLogin(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  public async assertLoginButtonIsVisible(): Promise<void> {
    await this.assertElementIsVisible(this.loginButton, 'Log In button');
  }

  public async assertLoginErrorMessageIsVisible(): Promise<void> {
    await this.assertElementIsVisible(this.loginErrorMessage, 'Login failed error message');
  }
}
