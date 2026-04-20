import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { WelcomePage } from '../pages/WelcomePage';

/**
 * PageManager is the single entry point tests use to access page objects.
 * Every page object is instantiated once in the constructor and exposed
 * through a dedicated *Instance() accessor.
 *
 * Pages are added incrementally as POMs are introduced — for each new POM,
 * add a `private readonly` field, instantiate it in the constructor, and
 * expose an `xxxInstance()` method.
 */
export class PageManager {
  private readonly loginPage: LoginPage;
  private readonly registerPage: RegisterPage;
  private readonly welcomePage: WelcomePage;

  constructor(private readonly page: Page) {
    this.loginPage = new LoginPage(this.page);
    this.registerPage = new RegisterPage(this.page);
    this.welcomePage = new WelcomePage(this.page);
  }

  loginPageInstance(): LoginPage {
    return this.loginPage;
  }

  registerPageInstance(): RegisterPage {
    return this.registerPage;
  }

  welcomePageInstance(): WelcomePage {
    return this.welcomePage;
  }
}
