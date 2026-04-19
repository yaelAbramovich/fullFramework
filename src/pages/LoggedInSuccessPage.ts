import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { resolveString } from '../utils/StringResolver';

export class LoggedInSuccessPage extends BasePage {
  private readonly secureAreaHeadingLocator: Locator;
  private readonly logoutButtonLocator: Locator;

  public constructor(page: Page) {
    super(page, 'LoggedInSuccessPage');

    this.secureAreaHeadingLocator = this.page
      .getByRole('heading', {
        name: resolveString('pages.loggedIn.secureAreaHeadingText'),
        exact: true,
      })
      .describe('Secure Area heading');
    this.logoutButtonLocator = this.page
      .getByRole('link', {
        name: resolveString('pages.loggedIn.logoutButtonAccessibleName'),
      })
      .describe('Logout button');
  }

  public async assertSecureAreaHeadingIsVisible(): Promise<void> {
    await this.assertElementIsVisible(
      this.secureAreaHeadingLocator,
      'Secure Area heading',
    );
  }

  public async assertLogoutButtonIsVisible(): Promise<void> {
    await this.assertElementIsVisible(this.logoutButtonLocator, 'Logout button');
  }

  public async clickLogoutButton(): Promise<void> {
    await this.clickOnElement(this.logoutButtonLocator, 'Logout button');
  }
}
