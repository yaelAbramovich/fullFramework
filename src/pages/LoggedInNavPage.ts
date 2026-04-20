import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class LoggedInNavPage extends BasePage {
  private readonly logoutLink: Locator;

  public constructor(page: Page) {
    super(page, 'LoggedInNavPage');

    this.logoutLink = this.page
      .getByRole('link', { name: strings.pages.loggedInNav.logoutLinkAccessibleName })
      .describe('Log Out link');
  }

  public async clickLogout(): Promise<void> {
    await this.clickOnElement(this.logoutLink, 'Log Out link');
  }
}
