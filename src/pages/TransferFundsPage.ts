import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class TransferFundsPage extends BasePage {
  private static readonly transferFundsEndpoint = '/parabank/transfer.htm';

  private readonly formHeading: Locator;
  private readonly amountField: Locator;
  private readonly fromAccountSelect: Locator;
  private readonly toAccountSelect: Locator;
  private readonly transferButton: Locator;
  private readonly transferCompleteHeading: Locator;
  private readonly genericErrorMessage: Locator;

  public constructor(page: Page) {
    super(page, 'TransferFundsPage');

    this.formHeading = this.page
      .getByRole('heading', { level: 1, name: strings.pages.transferFunds.formHeadingText })
      .describe('Transfer Funds form heading');

    this.amountField = this.page.getByRole('textbox').describe('Transfer amount field');

    this.fromAccountSelect = this.page
      .getByRole('combobox')
      .first()
      .describe('From account select');

    this.toAccountSelect = this.page
      .getByRole('combobox')
      .nth(1)
      .describe('To account select');

    this.transferButton = this.page
      .getByRole('button', { name: strings.pages.transferFunds.transferButtonAccessibleName })
      .describe('Transfer button');

    this.transferCompleteHeading = this.page
      .getByRole('heading', {
        level: 1,
        name: strings.pages.transferFunds.transferCompleteHeadingText,
      })
      .describe('Transfer Complete! heading');

    this.genericErrorMessage = this.page
      .getByText(strings.pages.transferFunds.genericErrorMessageText, { exact: true })
      .describe('Transfer generic error message');
  }

  public async gotoTransferFundsPage(): Promise<void> {
    await this.navigateToUrlPath(TransferFundsPage.transferFundsEndpoint);
  }

  public async fillAmount(amount: number | string): Promise<void> {
    await this.fillElementWithText(this.amountField, String(amount), 'Transfer amount field');
  }

  public async selectFromAccount(accountId: number): Promise<void> {
    await this.selectOptionFromDropdown(
      this.fromAccountSelect,
      String(accountId),
      'From account select',
    );
  }

  public async selectToAccount(accountId: number): Promise<void> {
    await this.selectOptionFromDropdown(
      this.toAccountSelect,
      String(accountId),
      'To account select',
    );
  }

  public async clickTransfer(): Promise<void> {
    await this.clickOnElement(this.transferButton, 'Transfer button');
  }

  public async transferAmount(
    amount: number,
    fromAccountId: number,
    toAccountId: number,
  ): Promise<void> {
    await this.fillAmount(amount);
    await this.selectFromAccount(fromAccountId);
    await this.selectToAccount(toAccountId);
    await this.clickTransfer();
  }

  public async assertFormHeadingIsVisible(): Promise<void> {
    await this.assertElementIsVisible(this.formHeading, 'Transfer Funds form heading');
  }

  public async assertTransferCompleteHeadingIsVisible(): Promise<void> {
    await this.assertElementIsVisible(
      this.transferCompleteHeading,
      `${strings.pages.transferFunds.transferCompleteHeadingText} heading`,
    );
  }

  public async assertTransferCompleteHeadingIsHidden(): Promise<void> {
    await this.assertElementIsHidden(
      this.transferCompleteHeading,
      `${strings.pages.transferFunds.transferCompleteHeadingText} heading`,
    );
  }

  public async assertGenericErrorMessageIsVisible(): Promise<void> {
    await this.assertElementIsVisible(
      this.genericErrorMessage,
      `${strings.pages.transferFunds.genericErrorMessageText} error message`,
    );
  }
}
