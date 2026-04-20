import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '../infrastructure/Logger';

/**
 * BasePage holds every shared Playwright action used by page objects.
 * Every concrete page object must extend this class.
 *
 * Locators are defined inside each concrete page object using Playwright's
 * semantic locators directly (this.page.getByRole, getByLabel, getByText,
 * getByPlaceholder, getByTestId, ...). BasePage does NOT wrap them — it only
 * consumes Locator instances inside its shared actions.
 *
 * Waiting strategy follows Playwright best practices
 * (https://playwright.dev/docs/best-practices):
 *   - Actions (click, fill, ...) auto-wait for actionability — no manual
 *     wait is needed before calling them.
 *   - For visibility / text / state checks use web-first assertions
 *     (expect(locator).toBeVisible() etc.), which auto-retry until the
 *     timeout is reached.
 *   - Do NOT use locator.waitFor() as a pre-action gate, and do NOT call
 *     expect(await locator.isVisible()).toBe(true) — those don't retry.
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly logger: Logger;

  /**
   * Absolute path that `goto()` navigates to. Every concrete POM declares
   * its own URL inline (e.g., `protected readonly urlPath = strings.pages.login.urlPath`),
   * so tests can call `pageManager.xxxInstance().goto()` without each POM
   * needing its own one-line `navigateToXxxPage()` wrapper.
   */
  protected abstract readonly urlPath: string;

  protected constructor(page: Page, pageLoggerName: string) {
    this.page = page;
    this.logger = new Logger(pageLoggerName);
  }

  // ---------- Navigation ----------

  public async goto(): Promise<void> {
    await this.navigateToUrlPath(this.urlPath);
  }

  protected async navigateToUrlPath(urlPath: string): Promise<void> {
    this.logger.info(`Navigating to URL: ${urlPath}`);
    await this.page.goto(urlPath);
  }

  public async getCurrentPageUrl(): Promise<string> {
    return this.page.url();
  }

  public async getCurrentPageTitle(): Promise<string> {
    return this.page.title();
  }

  // ---------- Actions (Playwright auto-waits for actionability) ----------

  protected async clickOnElement(
    elementLocator: Locator,
    elementDescription: string,
  ): Promise<void> {
    this.logger.info(`Clicking on element: ${elementDescription}`);
    await elementLocator.click();
  }

  protected async fillElementWithText(
    elementLocator: Locator,
    textValue: string,
    elementDescription: string,
  ): Promise<void> {
    this.logger.info(
      `Filling element "${elementDescription}" with text: ${textValue}`,
    );
    await elementLocator.fill(textValue);
  }

  protected async getVisibleTextFromElement(
    elementLocator: Locator,
    elementDescription: string,
  ): Promise<string> {
    this.logger.info(`Getting text from element: ${elementDescription}`);
    const textContent = await elementLocator.textContent();
    return (textContent ?? '').trim();
  }

  // ---------- Web-first assertions (auto-retry until timeout) ----------

  protected async assertElementIsVisible(
    elementLocator: Locator,
    elementDescription: string,
  ): Promise<void> {
    this.logger.debug(`Asserting element is visible: ${elementDescription}`);
    await expect(
      elementLocator,
      `Expected ${elementDescription} to be visible`,
    ).toBeVisible();
  }

  protected async assertElementIsHidden(
    elementLocator: Locator,
    elementDescription: string,
  ): Promise<void> {
    this.logger.debug(`Asserting element is hidden: ${elementDescription}`);
    await expect(
      elementLocator,
      `Expected ${elementDescription} to be hidden`,
    ).toBeHidden();
  }

  protected async assertElementHasExactText(
    elementLocator: Locator,
    expectedText: string,
    elementDescription: string,
  ): Promise<void> {
    this.logger.debug(
      `Asserting element "${elementDescription}" has exact text: ${expectedText}`,
    );
    await expect(
      elementLocator,
      `Expected ${elementDescription} to have exact text "${expectedText}"`,
    ).toHaveText(expectedText);
  }

  protected async assertElementContainsText(
    elementLocator: Locator,
    expectedText: string,
    elementDescription: string,
  ): Promise<void> {
    this.logger.debug(
      `Asserting element "${elementDescription}" contains text: ${expectedText}`,
    );
    await expect(
      elementLocator,
      `Expected ${elementDescription} to contain text "${expectedText}"`,
    ).toContainText(expectedText);
  }
}
