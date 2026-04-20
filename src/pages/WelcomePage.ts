import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class WelcomePage extends BasePage {
  protected readonly urlPath = strings.pages.welcome.urlPath;

  private readonly welcomeHeading: Locator;
  private readonly accountCreatedConfirmation: Locator;

  public constructor(page: Page) {
    super(page, 'WelcomePage');

    this.welcomeHeading = this.page
      .getByRole('heading', { level: 1 })
      .describe('Welcome heading');

    this.accountCreatedConfirmation = this.page
      .getByText(strings.pages.welcome.accountCreatedConfirmationText, { exact: true })
      .describe('"Your account was created successfully" confirmation message');
  }

  public async assertWelcomeHeadingForUserIsVisible(username: string): Promise<void> {
    const expectedText = strings.pages.welcome.welcomeHeadingTextTemplate.replace(
      '{username}',
      username,
    );
    await this.assertElementHasExactText(this.welcomeHeading, expectedText, 'Welcome heading');
  }

  public async assertAccountCreatedConfirmationIsVisible(): Promise<void> {
    await this.assertElementIsVisible(
      this.accountCreatedConfirmation,
      '"Your account was created successfully" confirmation message',
    );
  }

  public async assertSuccessfulRegistration(username: string): Promise<void> {
    await this.assertWelcomeHeadingForUserIsVisible(username);
    await this.assertAccountCreatedConfirmationIsVisible();
  }
}
