# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                              # install dependencies
npx playwright install chromium          # install browser(s) — add firefox/webkit for full cross-browser run
npm run typecheck                        # tsc --noEmit
npm run lint                             # eslint . (no-floating-promises is enforced)
npm test                                 # run all tests, all projects
npm run test:ui                          # only UI specs (tests/ui)
npm run test:api                         # only API specs (tests/api)
npm run test:headed                      # UI in headed mode
npm run test:debug                       # Playwright inspector
npm run report                           # open last HTML report
```

Run a single test / project / file:
```bash
npx playwright test tests/ui/login.spec.ts           # one file
npx playwright test --project=ui-chromium            # one project
npx playwright test -g "invalid password"            # by title grep
npx playwright test tests/ui/login.spec.ts:14        # file + line number
```

## Architecture

The framework layers map 1:1 to folders under `src/`. A test never talks to Playwright's `Page` directly — it always goes through a POM accessed via `PageManager`.

**Read/write flow of a UI test:**
```
test.spec.ts
  └── new PageManager(page)
        ├── loginPageInstance()            -> src/pages/LoginPage.ts
        │      └── extends BasePage        -> src/pages/BasePage.ts
        │             ├── actions log via  -> src/infrastructure/Logger.ts
        │             └── page strings via -> src/utils/strings.json
        └── loggedInSuccessPageInstance()  -> src/pages/LoggedInSuccessPage.ts
```

**API tests** follow the same shape: a test creates `new UsersApiClient(request)` (extends `BaseApiClient`), which wraps Playwright's `APIRequestContext` and adds the same logging conventions. API paths live on the client that uses them (as `private static readonly` constants), not in `strings.json`.

**Configuration** (`src/config/environment.ts`) is the only place `process.env` is read. It exposes a typed `environmentConfiguration` object that `playwright.config.ts` and the rest of the code import. Add a new env var there first, never read `process.env.*` from anywhere else.

## Non-obvious conventions (enforce when editing)

1. **Page UI strings live in `src/utils/strings.json`.** The framework is single-language (English). Every literal tied to a page — locator names (`getByLabel('…')`, `getByRole('…', { name: '…' })`), `.describe('…')` text, page URL paths, error / success message fragments, element descriptions passed to `BasePage` helpers — lives in `src/utils/strings.json` under `pages.*`. Callers import the JSON directly: `import strings from '../utils/strings.json'` (enabled by `resolveJsonModule: true` in `tsconfig.json`), then reference `strings.pages.xxx.yyy`. Page-string templates that need interpolation use the `{placeholder}` syntax and are rendered inline with `.replace('{placeholder}', value)`. Tests import the same JSON — do NOT reintroduce `public static readonly` class constants for page strings.

   **Out of scope for `strings.json`:** API request paths and framework log messages. API paths live on the client that uses them (`private static readonly` constants on the concrete `*ApiClient`, with small helpers for parameterised paths). Log messages are written as inline template literals at the call site (e.g., `` this.logger.info(`Clicking on element: ${elementDescription}`) ``). These are implementation details, not user-facing UI copy, and they stay next to the code that emits them.

2. **POMs must extend `BasePage`.** BasePage is the *only* place Playwright's `Locator`/`Page` APIs are consumed for actions and assertions. POMs define locators inline (e.g., `this.page.getByLabel(...)`, `this.page.getByRole(...)`) but every click/fill/assert goes through `BasePage` helpers (`clickOnElement`, `fillElementWithText`, `assertElementIsVisible`, `assertElementContainsText`, …). Each helper takes an `elementDescription` string for the log line.

3. **Locators: Playwright semantic APIs only.** Use `getByRole` / `getByLabel` / `getByText` / `getByPlaceholder` / `getByTestId` — never `page.locator(cssOrXPath)`. The user collects locators with Playwright MCP / codegen and pastes them directly into the POM constructor. Playwright does not have `getById`; the closest is `getByTestId` (uses `data-testid`).

3a. **Every locator must end with `.describe('…')`.** After the `getBy*` call, chain `.describe(strings.pages.xxx.descriptions.yyy)` so trace viewer / report output is readable. Example: `this.page.getByRole('button', { name: strings.pages.login.submitButtonAccessibleName }).describe(strings.pages.login.descriptions.submitButton)`. Applies to both field locators defined in the constructor and inline/dynamic locators built inside methods. The same description string is passed as the `elementDescription` argument to `BasePage` helpers — one key, both places.

4. **Web-first assertions only.** `await expect(locator).toBeVisible()` (wrapped as `assertElementIsVisible`) — never `expect(await locator.isVisible()).toBe(true)` and never `locator.waitFor({ state: 'visible' })` as a pre-action gate. Playwright's actions auto-wait; the only reason to assert visibility is to verify a state.

5. **PageManager pattern.** Fields are `private readonly`; every POM is instantiated in the constructor; tests access pages via `pageManager.xxxInstance()` accessor methods (not direct field access). When adding a POM: add a `private readonly` field, instantiate it in the constructor, expose an `xxxInstance()` method.

6. **Test isolation via `test.beforeEach`.** Shared setup (instantiate `PageManager`, navigate, verify ready state) lives in `beforeEach`. Each test gets a fresh Playwright `page` fixture — no shared state between tests.

7. **Playwright best practices are the source of truth.** The reference is https://playwright.dev/docs/best-practices. When reviewing or writing Playwright code, check it against that page and fix anti-patterns proactively (no `waitForTimeout`, no conditional `isVisible()` checks, no CSS/XPath, no manual promise assertions — `@typescript-eslint/no-floating-promises` catches the last one).

8. **POM methods must be small and single-behavior.** Each public POM method maps to *one* user action — filling one field, clicking one button, reading one piece of text. Multi-step flows (e.g., `submitLoginFormWithCredentials`) are implemented by calling the small methods, not by bundling actions into one monolithic body. Rationale: tests must be free to exercise partial interactions (type username only, click submit without password, validate on blur, etc.) — monolithic methods block that. The same rule applies to API clients: one request per method. When adding a POM method doing more than one user action, split it before merging.

## Adding things

- **New page object:** add strings under `pages.newPage.*` in `src/utils/strings.json` (include a `descriptions.*` sub-object for every locator's `.describe()` + `elementDescription` text). Create `src/pages/NewPage.ts` extending `BasePage`, `import strings from '../utils/strings.json'`, reference the strings via `strings.pages.newPage.*`, and register the POM in `PageManager` (field + constructor line + `newPageInstance()` accessor). If a string has a `{placeholder}`, substitute it at the call site with `.replace('{placeholder}', value)`.
- **New API client:** create `src/api/NewApiClient.ts` extending `BaseApiClient`. Hold each endpoint path as a `private static readonly` constant on the client; for parameterised paths add a small `private static` helper (e.g., `singleResourcePath(id: number): string`). Do NOT put API paths in `strings.json`.
- **New env var:** add to `.env.example`, then to `EnvironmentConfiguration` interface + `environmentConfiguration` object in `src/config/environment.ts`.
- **New log message:** write it as a template literal at the call site (e.g., `` this.logger.info(`Doing X with ${value}`) ``). Log copy does not go in `strings.json`.

## CI

`.github/workflows/playwright.yml` installs **only chromium** (per docs' "install only browsers you need"), then runs typecheck → lint → API tests → UI chromium. Traces are captured on the first retry (`trace: 'on-first-retry'` in `playwright.config.ts`); the HTML report is uploaded as an artifact.
