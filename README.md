# ParaBank Test Framework

End-to-end and API test automation framework for [ParaBank](https://parabank.parasoft.com/parabank/index.htm), built with **Playwright** and **TypeScript**. Covers UI flows, REST API contracts, and full end-to-end banking scenarios.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Running with Docker](#running-with-docker)
5. [Framework Architecture](#framework-architecture)
6. [Design Decisions & Tradeoffs](#design-decisions--tradeoffs)
7. [Assumptions](#assumptions)
8. [Scale Plan](#scale-plan)
9. [Infrastructure](#infrastructure)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 LTS |
| npm | bundled with Node 20 |
| Docker + Compose | 24+ (optional, for containerised runs) |

---

## Setup

```bash
# 1. Install Node dependencies
npm install

# 2. Install the Chromium browser used by CI and local runs
npx playwright install chromium

# 3. Configure environment
cp .env.example .env
# Edit .env if you need to point at a different ParaBank instance or adjust timeouts.
# The defaults work against the public ParaBank demo with no changes.
```

---

## Running Tests

### All tests
```bash
npm test
```

### By layer
```bash
npm run test:ui          # UI specs  (tests/ui/)
npm run test:api         # API specs (tests/api/)
npm run test:e2e         # E2E spec  (tests/e2e/)
```

### By tag
```bash
npm run test:smoke       # @smoke — fast, essential paths
npm run test:regression  # @regression — full regression suite
npm run test:negative    # @negative — error / sad-path cases
npm run test:apiNegative # @apiNegative — API error cases only
npm run test:uiNegative  # @uiNegative — UI error cases only
```

### Utilities
```bash
npm run test:headed      # run with a visible browser window
npm run test:debug       # open Playwright Inspector
npm run report           # open the last HTML report in the browser
npm run typecheck        # TypeScript type-check (no emit)
npm run lint             # ESLint
```

### Targeting a single file, test, or line
```bash
npx playwright test tests/ui/uiNegativeTests.spec.ts         # one file
npx playwright test --project=ui-chromium                    # one project
npx playwright test -g "invalid password"                    # by title grep
npx playwright test tests/ui/uiNegativeTests.spec.ts:14      # file + line
```

---

## Running with Docker

The Docker setup mirrors exactly what CI does: `CI=true`, Chromium only, 1 worker, retries on failure.

### Build and run (all tests)
```bash
docker compose up --build
```

Reports and test-results are mounted to the host automatically, so `npm run report` works after the container exits.

### Run a specific tag or project
```bash
# Override the default CMD inline:
docker compose run --rm tests npx playwright test --grep @smoke
docker compose run --rm tests npx playwright test --project=api
```

### Environment variables
`docker-compose.yml` reads from the host shell. To override, either export variables first or prefix the command:

```bash
UI_BASE_URL=https://my-staging-parabank.example.com docker compose up --build
```

---

## Framework Architecture

### Layer diagram

```
test.spec.ts
  └── pageManager fixture (src/infrastructure/fixtures.ts)
        └── PageManager (src/infrastructure/PageManager.ts)
              ├── LoginPage     ─┐
              ├── RegisterPage   │  all extend BasePage (src/pages/BasePage.ts)
              ├── WelcomePage    │     ├── actions/assertions via BasePage helpers
              ├── AccountsOverviewPage │  ├── Logger (src/infrastructure/Logger.ts)
              ├── TransferFundsPage    │  └── strings.json (user-facing text only)
              └── LoggedInNavPage ────┘

API test / E2E test
  └── suite fixture (tests/api/fixtures.ts)
        └── CustomersApiClient / AccountsApiClient
              └── extend BaseApiClient (src/api/BaseApiClient.ts)
                    └── Playwright APIRequestContext
```

### Key modules

| Path | Responsibility |
|------|---------------|
| `src/config/environment.ts` | Single place that reads `process.env`. Exports a typed config object consumed everywhere else. |
| `src/infrastructure/Logger.ts` | Structured logger with ISO timestamps and configurable severity. |
| `src/infrastructure/PageManager.ts` | Creates and exposes every POM. Tests never instantiate POMs directly. |
| `src/infrastructure/fixtures.ts` | Global Playwright fixture that injects `pageManager` into every test. |
| `src/pages/BasePage.ts` | Abstract base with all Playwright action/assertion helpers. No POM calls Playwright's `Page` API directly. |
| `src/api/BaseApiClient.ts` | Abstract base with `sendHttpRequest`, JSON parsing, and status assertions. |
| `src/utils/strings.json` | User-facing UI text only: accessible names, visible labels, app-rendered messages. |
| `src/utils/testData/` | Faker-based test data builders (unique usernames, realistic addresses, valid passwords). |
| `src/utils/validations/` | Reusable assertion helpers (account ownership, balance deltas, customer ID validity). |

### Why `BasePage` mediates all Playwright calls

Playwright's `Page` and `Locator` APIs are volatile between major versions. Channelling every click, fill, and assertion through `BasePage` helpers means a Playwright upgrade is a one-file change. It also guarantees consistent logging: every action emits an INFO-level log with an element description, so failures in traces are always traceable without reading source.

---

## Design Decisions & Tradeoffs

### Playwright over Cypress or Selenium
Playwright ships first-class TypeScript support, true multi-browser parallelism, native API request interception, and `APIRequestContext` — all without plugins. The auto-wait model eliminates manual `waitForSelector` / `sleep` patterns. The tradeoff is that Playwright's API is lower-level than Cypress's chainable syntax, but that pays off at scale when tests need programmatic control.

### Single codebase for UI and API tests
Sharing `BaseApiClient`, fixtures, test data builders, and validation helpers between API and E2E specs avoids duplication and lets an E2E test call an API mid-flow (e.g., creating a second account) without context-switching to a different framework. The cost is that the repository is larger than a pure UI or pure API project; the benefit is a single dependency tree and unified reporting.

### `strings.json` as the single source of user-facing text
All locator accessible names, visible labels, and app-rendered messages live in one file. A product change (e.g., a button label rename) is a one-line edit, and the change is immediately visible in every POM that uses it. Locator `.describe()` text and assertion failure messages are intentionally **not** in `strings.json` — those are internal, developer-facing strings that belong next to the code that emits them.

### Fresh user registration per E2E run
The E2E spec registers a brand-new user via the UI, then drives the full banking flow with that user's account. This guarantees test isolation: no shared state, no cleanup burden, and no risk of a previous run's data interfering. The tradeoff is that each E2E run is slower (one full registration flow) and depends on the registration endpoint being functional. When faster iteration is needed, a `storageState`-based auth setup project can be layered in without changing the existing tests.

### Chromium-only in CI
Installing and running three browsers triples CI time and download cost with diminishing returns for a banking application that targets modern desktop browsers. Chromium covers the dominant Blink/V8 rendering path. Firefox and WebKit can be added as separate projects and triggered on release branches or nightly schedules rather than every PR.

### `fullyParallel: true`, `workers: 1` in CI
`fullyParallel` enables intra-file parallelism (each `test` in a file can run concurrently on separate workers). Setting `workers: 1` in CI avoids race conditions on a shared external SUT (ParaBank demo) where concurrent writes from multiple workers could cause unpredictable state. Locally, workers default to the CPU count for fast feedback.

### Validation helpers as standalone functions
Account, customer, and transfer assertions live in `src/utils/validations/` rather than on the API clients or in the test bodies. This keeps clients thin (one request per method), tests readable (assert calls read as intent), and the assertion logic reusable across both the E2E spec and future API specs.

---

## Assumptions

- **ParaBank demo availability.** Tests run against `parabank.parasoft.com`, a publicly hosted demo. The suite assumes the service is up and responsive; there is no local instance or health-check gate.
- **Seed user exists.** `VALID_USERNAME=john` / `VALID_PASSWORD=demo` is a pre-seeded account in the ParaBank demo. API tests that exercise the authenticated path depend on this user being present.
- **Account IDs are positive integers.** Validation helpers reject IDs ≤ 0. If the SUT switches to a UUID scheme these helpers need updating.
- **Balance precision is two decimal places.** Transfer validation uses `toBeCloseTo(expected, 2)`. Amounts like `$0.001` transfers are not expected.
- **Registration always creates at least one account.** The E2E spec fetches accounts immediately after registration and asserts `length > 0`. If the SUT changes the onboarding flow this assertion will need adjustment.
- **No rate-limiting on the demo SUT.** Parallel local runs and rapid CI reruns assume the demo does not throttle requests.

---

## Scale Plan

### More browsers
Add a `firefox` and `webkit` project to `playwright.config.ts` and install those browsers. Wire them to the nightly or release-branch CI job. No test code changes required.

### More environments (dev / staging / prod)
Re-enable the commented-out `environment` input in `.github/workflows/playwright.yml`. Create `.env.dev`, `.env.staging`, `.env.prod`. Load the right file in CI via `dotenv -e .env.${{ inputs.environment }}` before running tests.

### Authenticated test scenarios without re-registering
Introduce a Playwright `setup` project that logs in once and saves `storageState` to a file. All UI projects that need pre-auth state declare `dependencies: ['setup']`. The E2E registration flow remains unchanged since it explicitly needs a fresh user.

### Larger team / more specs
- Group specs by feature under `tests/ui/`, `tests/api/`, `tests/e2e/` sub-directories with co-located fixture files.
- Tag new specs with `@smoke` (critical paths), `@regression` (full suite), and a feature tag (e.g., `@transfer`) so CI and on-demand runs can filter precisely.
- Move slow E2E tests to a nightly job; keep `@smoke` under 5 minutes.

### CI resource scaling
- Increase `workers` in CI once the SUT can handle concurrent writes (or once tests run against isolated per-run environments).
- Shard the test suite across GitHub Actions matrix jobs with `--shard=1/4`, `2/4`, etc.
- Cache the Playwright browser binaries between runs with `actions/cache` keyed on the `@playwright/test` version.

### Visual regression and accessibility
- Add `expect(page).toHaveScreenshot()` assertions to high-value pages once the UI stabilises.
- Integrate `@axe-core/playwright` for accessibility assertions without a separate toolchain.

---

## Infrastructure

### Configuration

All environment variables are read in exactly one place: `src/config/environment.ts`. It exports a typed `EnvironmentConfiguration` object; no other file ever calls `process.env.*`. New variables follow a three-step process: add to `.env.example`, add to the interface, add to the object with a safe default. This centralisation means a deployment pipeline only needs to inject variables in one known location, and TypeScript catches any reference to a non-existent config key at compile time.

### Reporting

Playwright generates an HTML report after every run. Key settings in `playwright.config.ts`:

| Setting | Value | Rationale |
|---------|-------|-----------|
| `trace` | `on-first-retry` | Trace is expensive; capturing on the first retry means it is always available for the first unexplained failure without adding overhead to clean runs. |
| `screenshot` | `only-on-failure` | Screenshots on every test add storage cost; failures are the only case where a screenshot aids diagnosis. |
| `video` | `retain-on-failure` | Same rationale as screenshots. |
| `retries` | `2` in CI, `0` locally | Local failures should be investigated immediately, not swallowed by retries. CI retries handle transient network flakiness. |

The HTML report is uploaded as a GitHub Actions artifact (14-day retention) and can be opened locally with `npm run report`.

### CI/CD Pipeline

`.github/workflows/playwright.yml` defines a single job with these steps in order:

```
checkout → install Node deps → install Chromium → typecheck → lint → API tests → UI tests → E2E tests → upload report
```

The job is triggered manually (`workflow_dispatch`) with a tag-filter dropdown (`Smoke`, `Regression`, `E2E`, `Negative`, etc.). This lets QA and developers run targeted subsets without editing YAML. The workflow is ready to be extended with `on: pull_request` (gates merges) or `on: schedule` (nightly regression) by adding a single line.

A second `docker` job builds the image and runs the `@smoke` suite inside the container, validating that the Dockerfile and image are always in a working state.

### Dockerization

**Base image:** `mcr.microsoft.com/playwright:v1.48.0-jammy` (Ubuntu 22.04). The official Playwright image ships all OS-level browser dependencies pre-installed, removing the need for `apt-get` commands and eliminating the class of CI failures caused by missing system libraries.

**Layer order:**
1. Copy `package*.json` and run `npm ci` — this layer is cached until dependencies change.
2. Run `npx playwright install chromium` — ensures the browser binary matches the exact `@playwright/test` version resolved by npm (which may be a newer patch than the base image's pre-bundled binary).
3. Copy the remaining source — cache-busted only by source changes.

**`CI=true`** is set in the image so Playwright's CI-specific behaviour (retries, workers, `forbidOnly`) activates automatically. There is no need to pass it at `docker run` time.

**docker-compose** wraps the build and run into a single command (`docker compose up --build`) and mounts `playwright-report/` and `test-results/` back to the host so the HTML report is viewable after the container exits. Environment variables fall back to the public ParaBank demo defaults, making the zero-configuration experience identical to a plain `npm test`.
