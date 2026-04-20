import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { WelcomePage } from '../pages/WelcomePage';
import { AccountsOverviewPage } from '../pages/AccountsOverviewPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { LoggedInNavPage } from '../pages/LoggedInNavPage';

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
  private readonly accountsOverviewPage: AccountsOverviewPage;
  private readonly transferFundsPage: TransferFundsPage;
  private readonly loggedInNavPage: LoggedInNavPage;

  constructor(private readonly page: Page) {
    this.loginPage = new LoginPage(this.page);
    this.registerPage = new RegisterPage(this.page);
    this.welcomePage = new WelcomePage(this.page);
    this.accountsOverviewPage = new AccountsOverviewPage(this.page);
    this.transferFundsPage = new TransferFundsPage(this.page);
    this.loggedInNavPage = new LoggedInNavPage(this.page);
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

  accountsOverviewPageInstance(): AccountsOverviewPage {
    return this.accountsOverviewPage;
  }

  transferFundsPageInstance(): TransferFundsPage {
    return this.transferFundsPage;
  }

  loggedInNavPageInstance(): LoggedInNavPage {
    return this.loggedInNavPage;
  }
}
