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
        │             └── strings via      -> src/utils/StringResolver.ts
        │                                         └── src/locales/en.json
        └── loggedInSuccessPageInstance()  -> src/pages/LoggedInSuccessPage.ts
```

**API tests** follow the same shape: a test creates `new UsersApiClient(request)` (extends `BaseApiClient`), which wraps Playwright's `APIRequestContext` and adds the same logging + locale-string conventions.

**Configuration** (`src/config/environment.ts`) is the only place `process.env` is read. It exposes a typed `environmentConfiguration` object that `playwright.config.ts` and the rest of the code import. Add a new env var there first, never read `process.env.*` from anywhere else.

## Non-obvious conventions (enforce when editing)

1. **No hardcoded user-facing / API / log strings.** Every literal lives in `src/locales/en.json` and is read via `resolveString('dot.notated.key')`. The resolver supports `{placeholder}` substitution. When adding a page/field/message, add the string to `en.json` first, then reference the key. Future locales (Hebrew, etc.) drop in as sibling JSON files.

2. **POMs must extend `BasePage`.** BasePage is the *only* place Playwright's `Locator`/`Page` APIs are consumed for actions and assertions. POMs define locators inline (e.g., `this.page.getByLabel(...)`, `this.page.getByRole(...)`) but every click/fill/assert goes through `BasePage` helpers (`clickOnElement`, `fillElementWithText`, `assertElementIsVisible`, `assertElementContainsText`, …). Each helper takes an `elementDescription` string for the log line.

3. **Locators: Playwright semantic APIs only.** Use `getByRole` / `getByLabel` / `getByText` / `getByPlaceholder` / `getByTestId` — never `page.locator(cssOrXPath)`. The user collects locators with Playwright MCP / codegen and pastes them directly into the POM constructor. Playwright does not have `getById`; the closest is `getByTestId` (uses `data-testid`).

3a. **Every locator must end with `.describe('…')`.** After the `getBy*` call, chain `.describe('Human-readable element name')` so trace viewer / report output is readable. Example: `this.page.getByRole('button', { name: 'Login' }).describe('Login submit button')`. Applies to both field locators defined in the constructor and inline/dynamic locators built inside methods. Descriptions are developer-facing debug strings and are allowed to be inline literals (not stored in `en.json`) — same precedent as the `elementDescription` parameter passed to `BasePage` actions.

4. **Web-first assertions only.** `await expect(locator).toBeVisible()` (wrapped as `assertElementIsVisible`) — never `expect(await locator.isVisible()).toBe(true)` and never `locator.waitFor({ state: 'visible' })` as a pre-action gate. Playwright's actions auto-wait; the only reason to assert visibility is to verify a state.

5. **PageManager pattern.** Fields are `private readonly`; every POM is instantiated in the constructor; tests access pages via `pageManager.xxxInstance()` accessor methods (not direct field access). When adding a POM: add a `private readonly` field, instantiate it in the constructor, expose an `xxxInstance()` method.

6. **Test isolation via `test.beforeEach`.** Shared setup (instantiate `PageManager`, navigate, verify ready state) lives in `beforeEach`. Each test gets a fresh Playwright `page` fixture — no shared state between tests.

7. **Playwright best practices are the source of truth.** The reference is https://playwright.dev/docs/best-practices. When reviewing or writing Playwright code, check it against that page and fix anti-patterns proactively (no `waitForTimeout`, no conditional `isVisible()` checks, no CSS/XPath, no manual promise assertions — `@typescript-eslint/no-floating-promises` catches the last one).

8. **POM methods must be small and single-behavior.** Each public POM method maps to *one* user action — filling one field, clicking one button, reading one piece of text. Multi-step flows (e.g., `submitLoginFormWithCredentials`) are implemented by calling the small methods, not by bundling actions into one monolithic body. Rationale: tests must be free to exercise partial interactions (type username only, click submit without password, validate on blur, etc.) — monolithic methods block that. The same rule applies to API clients: one request per method. When adding a POM method doing more than one user action, split it before merging.

## Adding things

- **New page object:** create `src/pages/NewPage.ts` extending `BasePage`, add its strings to `en.json` under `pages.newPage.*`, register it in `PageManager` (field + constructor line + `newPageInstance()` accessor).
- **New API client:** create `src/api/NewApiClient.ts` extending `BaseApiClient`, add paths to `en.json` under `api.newResource.*`.
- **New env var:** add to `.env.example`, then to `EnvironmentConfiguration` interface + `environmentConfiguration` object in `src/config/environment.ts`.
- **New log message:** add to `en.json` under `logs.actions.*` with `{placeholder}` tokens, reference via `resolveString`.

## CI

`.github/workflows/playwright.yml` installs **only chromium** (per docs' "install only browsers you need"), then runs typecheck → lint → API tests → UI chromium. Traces are captured on the first retry (`trace: 'on-first-retry'` in `playwright.config.ts`); the HTML report is uploaded as an artifact.
