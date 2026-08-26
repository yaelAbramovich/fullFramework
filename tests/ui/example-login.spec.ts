import { Page, Locator } from '@playwright/test';
import { test } from '../../src/infrastructure/fixtures';
import { BasePage } from '../../src/pages/BasePage';
import { environmentConfiguration } from '../../src/config/environment';

/**
 * Minimal concrete page object demonstrating BasePage against
 * the-internet.herokuapp.com/login. Local to this example test, not part
 * of the reusable src/pages framework.
 */
class ExampleLoginPage extends BasePage {
  private readonly usernameField: Locator;
  private readonly passwordField: Locator;
  private readonly submitButton: Locator;

  public constructor(page: Page) {
    super(page, 'ExampleLoginPage');

    this.usernameField = this.page.getByLabel('Username').describe('Username input field');
    this.passwordField = this.page.getByLabel('Password').describe('Password input field');
    this.submitButton = this.page
      .getByRole('button', { name: 'Login' })
      .describe('Login submit button');
  }

  public async open(): Promise<void> {
    await this.navigateToUrlPath('/login');
  }

  public async loginWith(username: string, password: string): Promise<void> {
    await this.fillElementWithText(this.usernameField, username, 'Username input field');
    await this.fillElementWithText(this.passwordField, password, 'Password input field');
    await this.clickOnElement(this.submitButton, 'Login submit button');
  }

  public async assertFlashMessageContains(expectedFragment: string): Promise<void> {
    const description = `Flash message containing "${expectedFragment}"`;
    const flashLocator = this.page.getByText(expectedFragment).describe(description);
    await this.assertElementIsVisible(flashLocator, description);
  }
}

test('logs in with valid credentials and shows the success message', async ({ page }) => {
  const loginPage = new ExampleLoginPage(page);

  await loginPage.open();
  await loginPage.loginWith(environmentConfiguration.uiUsername, environmentConfiguration.uiPassword);

  await loginPage.assertFlashMessageContains('You logged into a secure area!');
});
