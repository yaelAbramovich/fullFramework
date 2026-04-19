import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class LoggedInSuccessPage extends BasePage {
  private readonly secureAreaHeadingLocator: Locator;
  private readonly logoutButtonLocator: Locator;

  public constructor(page: Page) {
    super(page, 'LoggedInSuccessPage');

    this.secureAreaHeadingLocator = this.page
      .getByRole('heading', {
        name: strings.pages.loggedIn.secureAreaHeadingText,
        exact: true,
      })
      .describe(strings.pages.loggedIn.descriptions.secureAreaHeading);
    this.logoutButtonLocator = this.page
      .getByRole('link', { name: strings.pages.loggedIn.logoutButtonAccessibleName })
      .describe(strings.pages.loggedIn.descriptions.logoutButton);
  }

  public async assertSecureAreaHeadingIsVisible(): Promise<void> {
    await this.assertElementIsVisible(
      this.secureAreaHeadingLocator,
      strings.pages.loggedIn.descriptions.secureAreaHeading,
    );
  }

  public async assertLogoutButtonIsVisible(): Promise<void> {
    await this.assertElementIsVisible(
      this.logoutButtonLocator,
      strings.pages.loggedIn.descriptions.logoutButton,
    );
  }

  public async clickLogoutButton(): Promise<void> {
    await this.clickOnElement(
      this.logoutButtonLocator,
      strings.pages.loggedIn.descriptions.logoutButton,
    );
  }
}
