import { Page } from '@playwright/test';

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
  constructor(private readonly page: Page) {}
}
