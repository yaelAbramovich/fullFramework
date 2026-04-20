import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class AccountsOverviewPage extends BasePage {
  private static readonly accountsOverviewEndpoint = '/parabank/overview.htm';

  private readonly pageHeading: Locator;
  private readonly accountsTable: Locator;

  public constructor(page: Page) {
    super(page, 'AccountsOverviewPage');

    this.pageHeading = this.page
      .getByRole('heading', { level: 1, name: strings.pages.accountsOverview.pageHeadingText })
      .describe('Accounts Overview heading');

    this.accountsTable = this.page.getByRole('table').describe('Accounts Overview table');
  }

  public async gotoAccountsOverviewPage(): Promise<void> {
    await this.navigateToUrlPath(AccountsOverviewPage.accountsOverviewEndpoint);
  }

  private accountRow(accountId: number): Locator {
    return this.accountsTable
      .getByRole('row')
      .filter({
        has: this.page.getByRole('link', { name: String(accountId), exact: true }),
      })
      .describe(`Account #${accountId} row`);
  }

  public async assertPageHeadingIsVisible(): Promise<void> {
    await this.assertElementIsVisible(this.pageHeading, 'Accounts Overview heading');
  }

  public async assertAccountRowIsVisible(accountId: number): Promise<void> {
    await this.assertElementIsVisible(
      this.accountRow(accountId),
      `Account #${accountId} row`,
    );
  }
}
