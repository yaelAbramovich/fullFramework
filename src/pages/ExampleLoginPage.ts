import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class ExampleLoginPage extends BasePage {
  private readonly usernameField: Locator;
  private readonly passwordField: Locator;
  private readonly submitButton: Locator;

  public constructor(page: Page) {
    super(page, 'ExampleLoginPage');

    this.usernameField = this.page
      .getByLabel(strings.pages.login.usernameFieldLabel)
      .describe(strings.pages.login.descriptions.usernameField);
    this.passwordField = this.page
      .getByLabel(strings.pages.login.passwordFieldLabel)
      .describe(strings.pages.login.descriptions.passwordField);
    this.submitButton = this.page
      .getByRole('button', { name: strings.pages.login.submitButtonAccessibleName })
      .describe(strings.pages.login.descriptions.submitButton);
  }

  public async open(): Promise<void> {
    await this.navigateToUrlPath(strings.pages.login.urlPath);
  }

  public async loginWith(username: string, password: string): Promise<void> {
    await this.fillElementWithText(
      this.usernameField,
      username,
      strings.pages.login.descriptions.usernameField,
    );
    await this.fillElementWithText(
      this.passwordField,
      password,
      strings.pages.login.descriptions.passwordField,
    );
    await this.clickOnElement(this.submitButton, strings.pages.login.descriptions.submitButton);
  }

  public async assertFlashMessageContains(expectedFragment: string): Promise<void> {
    const description = strings.pages.login.descriptions.flashMessageWithFragment.replace(
      '{fragment}',
      expectedFragment,
    );
    const flashLocator = this.page.getByText(expectedFragment).describe(description);
    await this.assertElementIsVisible(flashLocator, description);
  }
}
