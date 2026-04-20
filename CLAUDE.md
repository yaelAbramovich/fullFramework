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

1. **Page UI strings live in `src/utils/strings.json` — and ONLY UI strings.** The framework is single-language (English). UI strings are literals the *end user of the application* sees, types, or interacts with: accessible names (`getByLabel('…')`, `getByRole('…', { name: '…' })`), visible text, placeholder text, and error / success message fragments rendered by the app. **URL paths are NOT user-facing strings** — they are routing details the user never reads, so they live as `private static readonly` endpoint constants on each POM (see rule #2), not in `strings.json`. These live in `src/utils/strings.json` under `pages.*`. Callers import the JSON directly: `import strings from '../utils/strings.json'` (enabled by `resolveJsonModule: true` in `tsconfig.json`), then reference `strings.pages.xxx.yyy`. Page-string templates that need interpolation use the `{placeholder}` syntax and are rendered inline with `.replace('{placeholder}', value)`. Tests import the same JSON — do NOT reintroduce `public static readonly` class constants for page strings.

   **Out of scope for `strings.json` — internal copy that callers see only in logs/traces/reports:** API request paths, framework log messages, **`.describe(...)` text on locators, `elementDescription` arguments passed to `BasePage` helpers, and `expect(...)` failure messages**. None of these are seen by the application's user; they exist purely to make Playwright traces, console logs, and HTML reports readable for the test author. They live next to the code that emits them — log messages as inline template literals at the call site, API paths as `private static readonly` constants on the concrete `*ApiClient`, and locator/assertion descriptions as **inline string literals at the `.describe(...)` call site** (and the same literal duplicated at the matching BasePage `elementDescription` argument). Do NOT centralize descriptions in a `DESCRIPTIONS` map / object / constant — keep them inline. For parameterized atomic methods (e.g., `fillField(fieldName, value)`) where one method serves many elements, derive the `elementDescription` from the parameter (e.g., `` `${fieldName} field` ``); perfect parity with the locator's `.describe(...)` text isn't required there. Putting any of these strings in `strings.json` would dilute it from "what the user sees" to "every string anywhere"; a translator/PM/copy-editor reading `strings.json` should see only user-facing copy.

2. **POMs must extend `BasePage`.** BasePage is the *only* place Playwright's `Locator`/`Page` APIs are consumed for actions and assertions. POMs define locators inline (e.g., `this.page.getByLabel(...)`, `this.page.getByRole(...)`) but every click/fill/assert goes through `BasePage` helpers (`clickOnElement`, `fillElementWithText`, `assertElementIsVisible`, `assertElementContainsText`, …). Each helper takes an `elementDescription` string for the log line.

   **Each navigable POM defines its own `public async goto<PageName>()` backed by a `private static readonly` endpoint constant.** URL paths are routing details the application's user never reads, so they live as named constants on the POM — never in `strings.json`. The navigation method name itself states the destination (`gotoLoginPage`, `gotoAccountsOverviewPage`, `gotoTransferFundsPage`, …) so it reads unambiguously in tests and trace viewer. Example: `private static readonly accountsOverviewEndpoint = '/parabank/overview.htm'` plus `public async gotoAccountsOverviewPage() { await this.navigateToUrlPath(AccountsOverviewPage.accountsOverviewEndpoint); }`. The endpoint constant name should describe the page's purpose (`loginEndpoint`, `transferFundsEndpoint`, …). BasePage exposes only the helper `protected async navigateToUrlPath(urlPath)` — there is no abstract `urlPath` field and no inherited `goto()`. Component-style POMs that have no standalone URL (e.g., a side-nav rendered on every authenticated page) simply omit a goto method entirely.

3. **Locators: Playwright semantic APIs only.** Use `getByRole` / `getByLabel` / `getByText` / `getByPlaceholder` / `getByTestId` — never `page.locator(cssOrXPath)`. The user collects locators with Playwright MCP / codegen and pastes them directly into the POM constructor. Playwright does not have `getById`; the closest is `getByTestId` (uses `data-testid`).

3a. **Every locator must end with `.describe('…')`.** After the `getBy*` call, chain `.describe(...)` so trace viewer / report output is readable. The description text is **internal** (read by test authors in traces and logs, not by application users) and therefore **does NOT live in `strings.json`** — see rule #1's "Out of scope" paragraph. **Inline the literal string directly inside the `.describe(...)` call** — do NOT centralize into a `DESCRIPTIONS` map / object / constant. Example: `this.page.getByRole('button', { name: strings.pages.login.submitButtonAccessibleName }).describe('Login submit button')`. Applies to both field locators defined in the constructor and inline/dynamic locators built inside methods. The **same** literal must also be passed as the `elementDescription` argument to `BasePage` helpers (the duplication is intentional and acceptable — POMs are small enough that the redundancy is trivial). For parameterized atomic methods, derive the `elementDescription` from the parameter (e.g., `` `${fieldName} field` ``).

4. **Web-first assertions only.** `await expect(locator).toBeVisible()` (wrapped as `assertElementIsVisible`) — never `expect(await locator.isVisible()).toBe(true)` and never `locator.waitFor({ state: 'visible' })` as a pre-action gate. Playwright's actions auto-wait; the only reason to assert visibility is to verify a state.

4a. **Every `expect(...)` MUST pass a descriptive message as its second argument.** Playwright's `expect(value, message?)` second parameter is rendered into the failure output and the HTML report — without it, a failure shows only the matcher diff and you have to dig through the trace to find which element / state was being checked. Required form: `expect(elementLocator, \`Expected ${elementDescription} to <verb> "${expectedValue}"\`).toMatcher(...)`. The verb mirrors the matcher (`be visible`, `be hidden`, `have exact text`, `contain text`, `have count`, `have value`, …); include the expected value when the matcher takes one. The message is constructed inline at the call site — do **not** lift it into `strings.json` (it is failure copy, not user-facing UI text — same rationale as log messages). Every existing `BasePage` assertion already follows this; new helpers and any inline `expect(...)` in tests must too. ESLint does not enforce this — code review and PR feedback do.

5. **PageManager pattern.** Fields are `private readonly`; every POM is instantiated in the constructor; tests access pages via `pageManager.xxxInstance()` accessor methods (not direct field access). When adding a POM: add a `private readonly` field, instantiate it in the constructor, expose an `xxxInstance()` method.

5a. **Specs consume `pageManager` via the fixture — never construct it inline.** The `pageManager` fixture lives in `src/infrastructure/fixtures.ts`. Specs import `test` (and `expect`) from that module — NOT from `@playwright/test` — and destructure `pageManager` from the test arguments: `test('...', async ({ pageManager }) => { ... })`. Never write `new PageManager(page)` inside a test body or `beforeEach`. Rationale: construction lives in one place, so auth state, per-test logging, or additional context can be wired in with a one-line change to the fixture factory instead of edits across every spec. For suite-local fixtures (e.g., an authenticated API request context only the E2E/API specs need), create `tests/<suite>/fixtures.ts` that extends the global `test`.

6. **Test isolation via `test.beforeEach`.** Shared setup (navigate, verify ready state, build per-test data) lives in `beforeEach`. Each test gets a fresh Playwright `page` fixture — no shared state between tests. The `pageManager` fixture handles construction; `beforeEach` only orchestrates the shared *actions* for the suite.

7. **Playwright best practices are the source of truth.** The reference is https://playwright.dev/docs/best-practices. When reviewing or writing Playwright code, check it against that page and fix anti-patterns proactively (no `waitForTimeout`, no conditional `isVisible()` checks, no CSS/XPath, no manual promise assertions — `@typescript-eslint/no-floating-promises` catches the last one).

8. **POM methods must be small and single-behavior.** Each public POM method maps to *one* user action — filling one field, clicking one button, reading one piece of text. Multi-step flows (e.g., `submitLoginFormWithCredentials`) are implemented by calling the small methods, not by bundling actions into one monolithic body. Rationale: tests must be free to exercise partial interactions (type username only, click submit without password, validate on blur, etc.) — monolithic methods block that. The same rule applies to API clients: one request per method. When adding a POM method doing more than one user action, split it before merging.

## Adding things

- **New page object:** add **only user-facing UI strings** under `pages.newPage.*` in `src/utils/strings.json` (accessible names, visible text, app-rendered messages — see rule #1). **URL paths do NOT go in `strings.json`** — they live as `private static readonly <purposeName>Endpoint = '/...';` constants on the POM. **Do NOT add a `descriptions.*` sub-object** — locator `.describe(...)` text and `elementDescription` log text are internal and inlined as literal strings at the `.describe(...)` and BasePage helper call sites (rule #3a; do not centralize into a `DESCRIPTIONS` map). Create `src/pages/NewPage.ts` extending `BasePage`, `import strings from '../utils/strings.json'`, reference the strings via `strings.pages.newPage.*`, **declare a `private static readonly newPageEndpoint = '/path/...'` and a `public async gotoNewPage()` method that calls `this.navigateToUrlPath(NewPage.newPageEndpoint)`** (see rule #2 — the method name itself states the destination), and register the POM in `PageManager` (field + constructor line + `newPageInstance()` accessor). For component-style POMs with no standalone URL (side nav, header), omit any goto method entirely. If a string has a `{placeholder}`, substitute it at the call site with `.replace('{placeholder}', value)`.
- **New API client:** create `src/api/NewApiClient.ts` extending `BaseApiClient`. Hold each endpoint path as a `private static readonly` constant on the client; for parameterised paths add a small `private static` helper (e.g., `singleResourcePath(id: number): string`). Do NOT put API paths in `strings.json`.
- **New env var:** add to `.env.example`, then to `EnvironmentConfiguration` interface + `environmentConfiguration` object in `src/config/environment.ts`.
- **New log message:** write it as a template literal at the call site (e.g., `` this.logger.info(`Doing X with ${value}`) ``). Log copy does not go in `strings.json`.

## CI

`.github/workflows/playwright.yml` installs **only chromium** (per docs' "install only browsers you need"), then runs typecheck → lint → API tests → UI chromium. Traces are captured on the first retry (`trace: 'on-first-retry'` in `playwright.config.ts`); the HTML report is uploaded as an artifact.
