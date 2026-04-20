import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class LoginPage extends BasePage {
  protected readonly urlPath = strings.pages.login.urlPath;

  private readonly usernameField: Locator;
  private readonly passwordField: Locator;
  private readonly loginButton: Locator;

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
}
