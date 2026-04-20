import { Page } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';

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
  private readonly registerPage: RegisterPage;

  constructor(private readonly page: Page) {
    this.registerPage = new RegisterPage(this.page);
  }

  registerPageInstance(): RegisterPage {
    return this.registerPage;
  }
}
