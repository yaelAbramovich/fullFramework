---
name: create-pom
description: Generate a Playwright Page Object Model for this repo. Drives Playwright MCP to inspect the target page in a live browser, writes the POM under src/pages/, adds its strings to src/utils/strings.json, extends BasePage if a helper is missing, and registers the POM in PageManager. Invoked explicitly by the user — never auto-trigger.
argument-hint: [PageClassName]
disable-model-invocation: true
allowed-tools: Bash(npm run typecheck), Bash(npm run lint), Bash(npx playwright test --list)
---

# create-pom

Generates a new Page Object Model for this Playwright framework. Follows every convention in the repo's `CLAUDE.md` **and** every applicable Playwright best practice at <https://playwright.dev/docs/best-practices> — no exceptions, no shortcuts. If any rule cannot be satisfied, **stop and ask the user**; do not silently produce a non-compliant POM.

## Playwright best practices this skill enforces

Source of truth: <https://playwright.dev/docs/best-practices>. Re-read the page before generating if the skill hasn't been touched in a while — Playwright docs evolve.

### Locators (most of the skill's correctness lives here)

- **Test user-visible behavior, not implementation.** Locator names, `.describe()` strings, and string keys must reflect what a user would see (button text, heading, label) — not CSS class names, component names, or internal ids. A reader of the POM should be able to picture the UI without opening the app.
- **Use Playwright's built-in locators** — they auto-wait and retry on actionability. Never compose your own wait/poll logic around a CSS selector.
- **Prefer user-facing attributes over CSS / XPath.** `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, `getByTitle`, `getByTestId` — in that family. The repo's own priority is `getByTestId` first (see Step 2 below); Playwright's docs agree CSS/XPath should be a last resort.
- **Chain and filter locators to scope into regions.** For repeating structures (lists, tables, cards, modals), use `.filter({ hasText: '…' })`, `.filter({ has: childLocator })`, and `parent.getByRole(…)` chaining instead of a single long selector. Example:
  ```ts
  this.page
    .getByRole('listitem')
    .filter({ hasText: strings.pages.checkout.cartItemLabel })
    .getByRole('button', { name: strings.pages.checkout.removeItemButtonName })
    .describe(strings.pages.checkout.descriptions.removeItemButton);
  ```
- **Generate locators with codegen when unsure** — `npx playwright codegen <url>` produces the same priority the repo follows. Use it via Playwright MCP; hand-picking brittle selectors is a smell.

### Assertions

- **Web-first assertions only.** `await expect(locator).toBeVisible()` — the framework-level wrapper is `assertElementIsVisible`. Never `expect(await locator.isVisible()).toBe(true)`; that form does not wait and will flake.
- **Never gate actions with `locator.waitFor({ state: 'visible' })`.** Playwright actions already auto-wait. A manual gate adds latency without improving reliability.
- **Every `expect(...)` MUST pass a descriptive message as its second argument** — `expect(value, message?)` renders the message into the failure output and the HTML report; without it, a failure shows only the matcher diff with no clue which element was being checked. Required form: `` expect(elementLocator, `Expected ${elementDescription} to <verb> "${expectedValue}"`).toMatcher(...) ``. The verb mirrors the matcher (`be visible`, `be hidden`, `have exact text`, `contain text`, `have count`, `have value`, …); include the expected value when the matcher takes one. Construct the message inline at the call site — do **not** lift it into `strings.json` (it is failure copy, not user-facing UI text). Existing BasePage helpers (`assertElementIsVisible`, `assertElementIsHidden`, `assertElementHasExactText`, `assertElementContainsText`) already follow this; any new BasePage helper or inline `expect(...)` must too.
- **Use `expect.soft(...)` for aggregate checks** when a single method legitimately needs to assert multiple independent states (e.g. `assertCheckoutSummaryIsCorrect`). Soft assertions let the test collect all failures in one run instead of aborting on the first mismatch. Prefer splitting into focused methods first; reach for soft only when a single logical assertion has genuine sub-parts. The descriptive-message rule above applies to `expect.soft(...)` exactly the same way.

### Test design (POM-adjacent)

- **Tests are independent; POMs are stateless across tests.** The POM must not cache data from one test into another (no module-level mutable state). Every field on the class is either readonly or scoped to a single `page` instance.
- **Don't exercise third-party services from a POM.** If the page integrates with an external provider (payments, auth, maps), the POM wraps *your* UI around it; **never** write assertions that depend on the third party's response. If the test needs to exercise that flow, the test uses Playwright's `page.route()` to mock the third-party call — the POM itself stays third-party-agnostic.

### Tooling / process

- **TypeScript + `@typescript-eslint/no-floating-promises` must stay clean.** Every async POM method is `await`ed by callers; the lint rule catches missing awaits. The skill runs `npm run typecheck` and `npm run lint` at the end — a failure there means the skill is not done.
- **Trace the failure, don't guess.** If a POM method behaves unexpectedly during manual smoke-testing after generation, run the failing scenario with `--trace on` and open it in the trace viewer; do not "fix" the POM by adding waits.

## Inputs you must collect before writing anything

1. **POM class name.** `$ARGUMENTS` if provided (e.g. `/create-pom CheckoutPage`). Otherwise, ask. Rules for the name:
   - Must end with `Page` (e.g. `CheckoutPage`, `ShoppingCartPage`, `UserProfilePage`).
   - Must describe the **purpose** of the page, not its position or index. Reject names like `Page1`, `MyPage`, `TheSecondScreen` — ask the user what the page is actually for and propose a better name.
2. **Navigation steps to reach the page.** Ask the user for the exact sequence of user actions that lead from the app's entry point to the target page. Example: "Log in as a standard user → click the 'Shopping Cart' icon in the header → click 'Checkout'". The skill must follow these literally. If a step is ambiguous, stop and ask — do not guess.
3. **Auth state.** Ask whether the target page requires a logged-in user. If yes, start from the shared `storageState` (same state the `ui-chromium` project uses). If no, start with `storageState: { cookies: [], origins: [] }`.
4. **Optional direct URL.** If the user already knows the URL and it's reachable without going through the nav steps, accept that as a shortcut.

## Preflight (do this every time before touching files)

- Confirm Playwright MCP tools are reachable in the current session. If they aren't, stop and tell the user to start the Playwright MCP server before re-invoking the skill — do not fall back to guessing locators from screenshots or memory.
- Re-read `CLAUDE.md` (sections: "Non-obvious conventions", "Adding things") so any rule updates since this skill was written are picked up.
- Re-read `src/pages/BasePage.ts` and note every `protected` helper currently exposed. The POM **must reuse** these — never reimplement `click`, `fill`, or `expect` directly.
- Read `src/utils/strings.json` and `src/infrastructure/PageManager.ts` so you know the current shape before editing.
- Check whether `src/pages/<ClassName>.ts` already exists. If it does, ask the user: overwrite, merge, or cancel.

## Workflow

### Step 1 — Drive the browser via Playwright MCP

- Open the app at the framework's base URL (`environmentConfiguration.uiBaseUrl` — fall back to `https://the-internet.herokuapp.com`).
- Execute each navigation step the user gave you using Playwright MCP (`browser_navigate`, `browser_click`, `browser_type`, `browser_select_option`, …). Do not invent steps.
- Once the browser is on the target page, capture:
  - An accessibility snapshot (`browser_snapshot`) — gives you every interactive element with its role + accessible name.
  - The raw HTML / DOM — needed to detect `data-testid` attributes that the a11y tree hides.
- If the page has several visually distinct regions (header, side nav, main content), inspect each one before deciding which elements belong in this POM. Pages that cover multiple concerns should be split into multiple POMs.

### Step 2 — Pick a locator for every interactive element

For each element you plan to expose as a locator on the POM, walk this list **in order** and stop at the first that works:

1. **`this.page.getByTestId('value')`** — preferred whenever a `data-testid` exists on the element.
2. `this.page.getByRole('role', { name: 'Accessible Name' })`
3. `this.page.getByLabel('label text')`
4. `this.page.getByPlaceholder('placeholder text')`
5. `this.page.getByText('visible text')`
6. **Chain + filter** a locator from one of the options above — use this whenever the page has repeating structures (lists, tables, cards) or you need to scope into a region. Always prefer this over a deeper CSS selector:
   ```ts
   this.page
     .getByRole('listitem')                                        // scope into a region
     .filter({ hasText: strings.pages.cart.productNameText })       // narrow by user-visible text
     .getByRole('button', { name: strings.pages.cart.removeButton }) // land on the element
     .describe(strings.pages.cart.descriptions.removeButton);
   ```
   `.filter({ hasText })`, `.filter({ has: locator })`, and locator chaining are Playwright-native and auto-retry — they are not a last resort.
7. **`this.page.locator('<css or xpath>')`** — absolute last resort. If you reach this step, first ask the user: would it be possible to add a `data-testid` to the element? Only fall through to `locator()` if they say no.

**If you can't decide between options**, run `npx playwright codegen <url>` via Playwright MCP and let it pick — it applies the same priority and produces Playwright-idiomatic output.

Every locator **must** end with `.describe('Human-readable element name')`. The string passed to `.describe()` must be the **same** string passed as the `elementDescription` argument to BasePage helpers — one source, two uses.

### Step 3 — UI strings vs internal code strings (the single most-broken rule)

**The bright line:** `strings.json` contains **only what the application's user sees**. Internal code strings — read only by *test authors* in logs, traces, reports, or failure output — must **never** appear in `strings.json`. They are inlined as literals at the call site that emits them.

**What goes in `strings.json` (UI strings):**

| Category | Examples |
|---|---|
| Accessible names | `getByRole('button', { name: '<name>' })`, `getByLabel('<label>')`, `getByPlaceholder('<placeholder>')` |
| Visible text | `getByText('<text>')`, page heading text, table cell text |
| URL paths | `'/checkout'`, `'/users/profile'` |
| App-rendered messages | success / error / flash messages the app itself renders to the user |

**What MUST NOT go in `strings.json` (internal code strings — three categories the team most often gets wrong):**

| Category | Where it lives instead | Example |
|---|---|---|
| **Logger calls** (`this.logger.info(...)`, `.debug(...)`, etc.) | Inline template literal at the call site | `` this.logger.info(`Filling element "${elementDescription}" with text: ${textValue}`) `` |
| **`expect(...)` failure messages** (the second arg of `expect(value, message?)` and `expect.soft(value, message?)`) | Inline template literal at the call site | `` expect(locator, `Expected ${elementDescription} to be visible`).toBeVisible() `` |
| **Locator `.describe(...)` text and BasePage `elementDescription` arguments** | Inline string literal at the `.describe(...)` call site, duplicated at the matching BasePage helper call | `.describe('Place order button')` and `clickOnElement(this.placeOrderButton, 'Place order button')` |

**Why the line is drawn here:** `strings.json` is the file a translator / PM / copy-editor would read. They should see only literals the application's user sees. Putting log copy, expect messages, or describe text in there dilutes its purpose, makes localization (if it ever ships) harder, and forces a reader chasing a log line or a trace label to jump from a file to JSON for no benefit.

**3a. UI strings → `src/utils/strings.json`**

Open `src/utils/strings.json`. Under `pages.<lowerCamelKey>` (strip the `Page` suffix from the class name: `CheckoutPage` → `pages.checkout`, `ShoppingCartPage` → `pages.shoppingCart`), add **only** literals that come from the application's UI:

```json
"checkout": {
  "urlPath": "/checkout",
  "pageTitleHeadingText": "Checkout",
  "placeOrderButtonAccessibleName": "Place order",
  "orderConfirmedFlashFragment": "Your order is confirmed"
}
```

Rules for `strings.json`:

- Only **user-facing** text (the four categories in the first table above).
- **Do NOT add a `descriptions` sub-object.** Locator `.describe(...)` and BasePage `elementDescription` text is internal — see 3b.
- **Do NOT add log message strings or expect failure-message strings.** Both are inlined at the call site that emits them.
- Templates that need runtime values use `{placeholder}` syntax. In the POM, substitute them with `.replace('{placeholder}', value)` at the call site. Do **not** reintroduce a `formatString` / resolver helper — the project explicitly removed it.

**3b. Description strings → inline literals at the `.describe(...)` call site**

Locator `.describe(...)` text and BasePage `elementDescription` arguments are read by test authors in trace viewer / HTML report / console logs — never by the application's user. **Inline the literal string directly inside each `.describe(...)` call, and inline the same literal at the matching BasePage helper call** (the duplication is intentional — POMs are small, and the redundancy is preferable to a centralized map).

Example:

```ts
this.placeOrderButton = this.page
  .getByRole('button', { name: strings.pages.checkout.placeOrderButtonAccessibleName })
  .describe('Place order button');

// ...later, in an action method:
public async clickPlaceOrderButton(): Promise<void> {
  await this.clickOnElement(this.placeOrderButton, 'Place order button');
}
```

Rules for inline descriptions:

- **Do NOT introduce a `const DESCRIPTIONS = { ... }` map / object / constant.** Keep descriptions inline at every call site.
- The literal in `.describe(...)` and the literal passed to the BasePage helper should match for non-parameterized cases.
- For parameterized atomic methods (e.g. `fillField(fieldName, value)`), derive the `elementDescription` from the parameter — typically `` `${fieldName} field` `` or similar. Perfect parity with the locator's `.describe(...)` text isn't required for parameterized methods; the locator already carries the richer description for trace viewer, and the log line just needs an identifier.
- For dynamic/inline locators built inside methods, chain `.describe(...)` with a literal that may interpolate runtime values (e.g., `` `Order confirmation banner for order "${orderId}"` ``).

**3c. Log strings & expect failure messages → inline template literals at the call site**

These never need a separate section because the existing helpers already enforce it:

- **Log calls** (`this.logger.info`, `.debug`, `.warn`, `.error`) take a template literal directly. Look at any helper in `BasePage.ts` for the canonical form (`` `<Verb> on element: ${elementDescription}` ``). If you add a new BasePage helper in Step 4, follow the same shape — never read from `strings.json` for the log copy.
- **`expect(...)` second-arg messages** are constructed inline as well (rule encoding row #12, anti-pattern #4a). Form: `` expect(value, `Expected ${elementDescription} to <verb> "${expectedValue}"`).toMatcher(...) ``.

### Step 4 — Extend `BasePage` if (and only if) something is missing

Before writing the POM, check which BasePage helpers the new page needs. If an interaction isn't covered (e.g. `selectOptionFromDropdown`, `hoverOverElement`, `uploadFileToInput`, `pressKeyboardKey`), add a new `protected` method to `src/pages/BasePage.ts`:

- Signature: `(elementLocator: Locator, …action-specific args…, elementDescription: string) => Promise<...>`.
- Log the action via `this.logger.info(`<Verb> on element: ${elementDescription}`)` (or similar — match the style already in the file).
- Use only web-first, auto-waiting Playwright APIs. **No** `waitForTimeout`, **no** `locator.waitFor({ state: 'visible' })` as a pre-action gate.
- Assertion helpers follow the existing `assertElement...` pattern and log at `debug` level, not `info`.

If you don't need a new helper, don't touch BasePage.

### Step 5 — Write the POM file

Create `src/pages/<ClassName>.ts` with this exact structure (method groups must appear in this order):

```ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import strings from '../utils/strings.json';

export class <ClassName> extends BasePage {
  // 1. Private readonly locator fields (one per interactive element)
  private readonly <locator1>: Locator;
  private readonly <locator2>: Locator;

  // 2. Constructor — instantiate locators with the priority from Step 2
  public constructor(page: Page) {
    super(page, '<ClassName>');

    this.<locator1> = this.page
      .getByTestId(strings.pages.<key>.<testIdKey>)
      .describe(strings.pages.<key>.descriptions.<locator1>);
    // …
  }

  // 3. Atomic actions — one user interaction per method
  public async fillUsernameField(username: string): Promise<void> {
    await this.fillElementWithText(
      this.usernameInputLocator,
      username,
      strings.pages.<key>.descriptions.usernameField,
    );
  }

  public async fillPasswordField(password: string): Promise<void> { /* … */ }
  public async clickLoginSubmitButton(): Promise<void> { /* … */ }

  // 4. Composite actions — compose atomics into reusable flows.
  //    Name composites so the caller can predict behavior from the name alone.
  public async fillUsernamePasswordAndLogin(
    username: string,
    password: string,
  ): Promise<void> {
    await this.fillUsernameField(username);
    await this.fillPasswordField(password);
    await this.clickLoginSubmitButton();
  }

  // 5. Assertions — always at the bottom of the class
  public async assertLoginFormIsVisible(): Promise<void> { /* … */ }
}
```

Rule encoding (these map 1-to-1 to the repo's POM rules — verify each one before saving the file):

| # | Rule | How it's enforced |
|---|---|---|
| 1 | No hard-coded UI strings | Every literal a user would see (accessible names, labels, placeholders, visible text, URL paths, app-rendered messages) comes from `strings.pages.<key>.*`. Zero such literals inside the POM class body. |
| 1a | `strings.json` contains ONLY user-facing UI strings | Three categories of **internal code strings** must NEVER appear in `strings.json` and are inlined at the call site instead: (1) **logger calls** (`this.logger.info/.debug/.warn/.error`) — inline template literals; (2) **`expect(...)` failure messages** (the second arg) — inline template literals (see rule #12); (3) **locator `.describe(...)` text and BasePage `elementDescription` arguments** — inline string literals (see Step 3b, rule #4). No `descriptions` sub-object, no log-message keys, no expect-message keys. |
| 2 | Uses `BasePage` helpers | Every action / assertion goes through `clickOnElement`, `fillElementWithText`, `assertElementIsVisible`, etc. Missing helper → added to BasePage in Step 4. |
| 3 | Locator priority | `getByTestId` first, semantic `getBy*` next, `locator()` only as last resort. |
| 4 | `.describe()` on every locator | Constructor-level and inline/dynamic locators both chain `.describe('Inline literal description')`. Do NOT centralize into a `DESCRIPTIONS` map. The same literal is duplicated at the BasePage helper's `elementDescription` argument for non-parameterized methods; for parameterized atomic methods (e.g. `fillField(fieldName, value)`), derive the `elementDescription` from the parameter (e.g. `` `${fieldName} field` ``). |
| 5 | Small atomic + composite methods | Each atom = one user action. At least one composite that bundles atoms (e.g. `fillUsernamePasswordAndLogin`). Never bundle unrelated actions into a single atom. |
| 6 | Informative names | Verb + target + qualifier: `clickCheckoutCtaButton`, `assertCartIsEmpty`, `fillShippingAddressField`. No `click()`, `check()`, `doThing()`. |
| 7 | Registered in PageManager | See Step 6. |
| 8 | Purposeful class name | Ends in `Page`; describes the page's role, not its ordinal position. |
| 9 | Lives under `src/pages/` | File path is `src/pages/<ClassName>.ts`. |
| 10 | No implicit waits | Web-first assertions (`expect(locator).toBeVisible()` wrapped as `assertElementIsVisible`). No `waitForTimeout`, no `locator.waitFor()` as a pre-action gate. |
| 11 | Assertions at the bottom | All `assertXxx()` methods come last, after atomic + composite actions. |
| 12 | Every `expect(...)` has a descriptive message | Second arg of every `expect(value, message?)` and `expect.soft(value, message?)` is a descriptive sentence — `` `Expected ${elementDescription} to <verb> "${expectedValue}"` ``. Verb mirrors the matcher; expected value included when the matcher takes one. Built inline at the call site, never lifted to `strings.json`. Existing BasePage helpers already comply; verify any new helper or any inline `expect(...)` you add does too. |

### Step 6 — Register in `PageManager`

Open `src/infrastructure/PageManager.ts`. Add, following the existing pattern exactly:

```ts
// at the top
import { <ClassName> } from '../pages/<ClassName>';

// inside the class
private readonly <lowerCamel>: <ClassName>;

// inside the constructor
this.<lowerCamel> = new <ClassName>(this.page);

// accessor method
<lowerCamel>Instance(): <ClassName> {
  return this.<lowerCamel>;
}
```

Convention: the accessor is `<lowerCamelClassName>Instance()` — e.g. `CheckoutPage` → `checkoutPageInstance()`. A test always reaches the POM through `pageManager.checkoutPageInstance().xxx()`; never via a direct `new CheckoutPage(page)` or field access.

### Step 7 — Verify the result

Run — and do not consider the skill done until both pass cleanly:

```bash
npm run typecheck
npm run lint
```

Then:

```bash
npx playwright test --list
```

The list command won't create tests for the new POM, but it confirms Playwright still parses the config and no existing spec broke.

### Step 8 — Report back

Summarize to the user, in this shape:

- **Class + file path** — `src/pages/<ClassName>.ts`
- **Locator strategies used** — one-line count of each strategy in the final POM: `getByTestId: N`, `getByRole: N`, `getByLabel: N`, `getByPlaceholder: N`, `getByText: N`, chained/filtered: N, `locator()`: N. **If `locator()` or any CSS / XPath selector was used, flag it as technical debt** — quote the Playwright best practice ("prefer user-facing attributes over XPath or CSS selectors") and recommend the dev team add a `data-testid` to that element.
- **Strings added to `strings.json`** — list only the new UI keys under `strings.pages.<key>` (accessible names, visible text, URL paths, app messages). If you were tempted to add a `descriptions` sub-object, you did the wrong thing — those go in the POM's `DESCRIPTIONS` map.
- **Inline description literals** — list the description strings inlined at each `.describe(...)` call in the POM (one per locator). Confirm none were lifted into a `DESCRIPTIONS` map / object / constant.
- **New BasePage helper** — if one was added, name it and explain what it wraps. If none, say "no BasePage change needed".
- **PageManager accessor** — the name of the new `xxxInstance()` method.
- **Typecheck + lint status** — pass / fail with error summary if fail.
- **Playwright-best-practice sanity check** — confirm, one line per item: locators are user-facing (no class-name / implementation-detail locators), no implicit waits, all assertions are web-first, every `expect(...)` / `expect.soft(...)` passes a descriptive message as its second argument, any assertion method with multiple independent checks uses `expect.soft` (or is split into separate methods).

## Anti-patterns — refuse and explain

If the user's request would violate any of the rules below, stop and explain why. Do **not** produce the POM.

1. **`Page` or `Locator` used directly in a test file.** Tests access pages only through `PageManager.xxxInstance()`.
2. **A POM method that performs more than one user action.** Split into atoms + one composite. The composite is allowed; a monolithic atom that hides multiple clicks is not.
3. **Any `page.waitForTimeout(...)`, arbitrary `setTimeout`, or `.waitFor({ state: 'visible' })` as a pre-action gate.** Web-first assertions only (Playwright best practices: "use web-first assertions", "avoid manual assertions without awaiting").
4. **Manual assertions that don't await** — e.g. `expect(await locator.isVisible()).toBe(true)`. These don't retry and will flake. Use the `assertElementIsVisible` wrapper.
4a. **`expect(...)` or `expect.soft(...)` without a descriptive message** as the second argument. Failure output without it shows only the matcher diff. Required form: `` expect(value, `Expected ${elementDescription} to <verb> "${expectedValue}"`).toMatcher(...) ``.
5. **Hard-coded UI strings in the POM body** (accessible names, visible text, labels, placeholders, URL paths, app messages), even for "obvious" things like button names. They go in `strings.json`. (Locator `.describe(...)` text and BasePage `elementDescription` arguments are *not* UI strings — they are inlined as literals at the call site; see Step 3b.)
5a. **Putting any internal code string into `strings.json`** — specifically: (1) **logger call copy** (the template inside `this.logger.info/.debug/.warn/.error`), (2) **`expect(...)` failure messages** (the second arg of `expect(value, message?)`), or (3) **locator `.describe(...)` text and BasePage `elementDescription` arguments** (e.g., a `descriptions` sub-object). All three are internal — read by test authors in logs, traces, reports, and failure output, **never by the application's user**. They are inlined as template literals or string literals at the call site that emits them. `strings.json` is the file a translator / PM / copy-editor would read; it must contain only what the application's user sees. If you find an existing `descriptions` sub-object, log message lifted to JSON, or expect-message key in `strings.json`, fix it before proceeding with the new POM.
5b. **Centralizing description strings in a `const DESCRIPTIONS = { ... }` map / object / constant.** Inline the literal at every `.describe(...)` and BasePage-helper call site instead. The duplication is intentional: POMs are small, descriptions are short, and a centralized map adds an indirection for the reader.
6. **Locator built from a CSS / XPath selector** when a `data-testid`, semantic `getBy*`, or chain-and-filter alternative exists. Ask for a test id instead.
7. **Locator that relies on implementation details** (CSS class names, component IDs, framework-generated attributes) — Playwright best practices: "test user-visible behavior". The locator must be expressible in terms the user can see.
8. **Third-party calls in the POM or test assertions.** Mock them with `page.route()` at the test level; the POM itself stays third-party-agnostic.
9. **Class name that doesn't end in `Page` or doesn't describe a real purpose.**
10. **Skipping PageManager registration.** Every POM must be reachable from `PageManager`; unreachable POMs mean tests can't use them.
11. **Reintroducing a `StringResolver` / `formatString` / locale bundle.** This project deliberately removed those — use `.replace('{placeholder}', value)` at the call site for templated strings.

## Example invocation

```
/create-pom CheckoutPage
```

The skill then asks:

> What are the exact navigation steps to reach the checkout page from the app's entry point?
> Does this page require a logged-in user?

…and proceeds through Steps 1–8.
