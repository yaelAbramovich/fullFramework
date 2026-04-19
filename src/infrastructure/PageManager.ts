import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { LoggedInSuccessPage } from '../pages/LoggedInSuccessPage';

/**
 * PageManager is the single entry point tests use to access page objects.
 * Every page object is instantiated once in the constructor and exposed
 * through a dedicated *Instance() accessor.
 *
 * Usage:
 *   const pageManager = new PageManager(page);
 *   await pageManager.loginPageInstance().openLoginPage();
 */
export class PageManager {
  private readonly page: Page;
  private readonly loginPage: LoginPage;
  private readonly loggedInSuccessPage: LoggedInSuccessPage;

  constructor(page: Page) {
    this.page = page;
    this.loginPage = new LoginPage(this.page);
    this.loggedInSuccessPage = new LoggedInSuccessPage(this.page);
  }

  loginPageInstance() {
    return this.loginPage;
  }

  loggedInSuccessPageInstance() {
    return this.loggedInSuccessPage;
  }
}
