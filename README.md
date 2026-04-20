# ParaBank Test Framework

Playwright + TypeScript automation framework for [parabank.parasoft.com](https://parabank.parasoft.com/parabank). Covers UI flows, REST API contracts, and full E2E banking scenarios in a single codebase.

---

## Prerequisites

- Node.js 22+
- Docker + Compose (optional)

---

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # defaults work against the public demo out of the box
```

---

## Running Tests

```bash
npm test                   # all tests
npm run test:ui            # UI specs  (tests/ui/)
npm run test:api           # API specs (tests/api/)
npm run test:e2e           # E2E spec  (tests/e2e/)
npm run test:smoke         # @smoke tag
npm run test:regression    # @regression tag
npm run test:negative      # @negative tag
npm run test:headed        # visible browser
npm run test:debug         # Playwright Inspector
npm run report             # open last HTML report
npm run typecheck          # TypeScript check
npm run lint               # ESLint
```

---

## Docker

```bash
docker compose up --build                                               # all tests
docker compose run --rm tests npx playwright test --grep @smoke        # one tag
docker compose run --rm tests npx playwright test --project=api        # one project
```

Reports are mounted to `./playwright-report/` on the host — open with `npm run report` after the container exits.

---

## Architecture

```
test.spec.ts
  └── pageManager fixture (src/infrastructure/fixtures.ts)
        └── PageManager (src/infrastructure/PageManager.ts)
              └── POMs: LoginPage, RegisterPage, WelcomePage,
                        AccountsOverviewPage, TransferFundsPage, LoggedInNavPage
                        (all extend BasePage — src/pages/BasePage.ts)

API / E2E tests
  └── CustomersApiClient / AccountsApiClient
        (extend BaseApiClient — src/api/BaseApiClient.ts)
```

| Path | Responsibility |
|------|---------------|
| `src/config/environment.ts` | Only place `process.env` is read. Exports a typed config object. |
| `src/infrastructure/` | Logger, PageManager, global `pageManager` fixture. |
| `src/pages/BasePage.ts` | All Playwright actions and assertions go through here — never called directly from POMs. |
| `src/api/BaseApiClient.ts` | HTTP request helpers, JSON parsing, status assertions. |
| `src/utils/strings.json` | User-facing UI text only (accessible names, visible labels, app messages). |
| `src/utils/testData/` | Faker-based data builders — unique usernames, valid passwords, realistic addresses. |
| `src/utils/validations/` | Reusable assertion helpers for accounts, balances, and customer IDs. |

---

## Design Decisions & Tradeoffs

**Playwright over Cypress / Selenium** — native TypeScript, built-in `APIRequestContext` (UI + API in one framework), auto-wait, true multi-browser parallelism. Tradeoff: lower-level API than Cypress; pays off at scale.

**BasePage / BaseApiClient mediate all framework calls** — POMs and API clients never call Playwright APIs directly. A version upgrade is a one-file change; every action emits a consistent log line readable in traces.

**`strings.json` for user-facing text only** — accessible names and visible labels in one file; a label rename is one edit. Internal copy (log messages, trace descriptions) lives inline next to the code that emits it.

**Fresh user registration per E2E run** — guarantees clean state, no shared data, no teardown. Tradeoff: slower test and depends on the registration endpoint being healthy.

**`workers: 1` in CI, `fullyParallel: true` locally** — prevents race conditions on the shared external SUT in CI while keeping local feedback fast.

**Validation helpers as standalone functions** — `src/utils/validations/` keeps API clients thin (one request per method) and makes assertions reusable across specs.

---

## Assumptions

- ParaBank demo (`parabank.parasoft.com`) is available and responsive.
- Seed user `john` / `demo` exists in the demo environment.
- Account IDs are positive integers; balance precision is two decimal places.
- Registration always creates at least one account for the new user.

---

## Scale Plan

- **More browsers** — add `firefox` / `webkit` projects to `playwright.config.ts`; no test changes needed.
- **Multi-environment** — enable the commented `environment` input in the workflow; add `.env.dev` / `.env.staging` / `.env.prod`.
- **Auth caching** — add a `setup` project that saves `storageState`; downstream projects declare `dependencies: ['setup']`.
- **Sharding** — split suite across GitHub Actions matrix jobs with `--shard=1/N` as the test count grows.
- **Feature tagging** — tag new specs `@smoke` + feature tag (e.g. `@transfer`); move slow E2E tests to a nightly schedule.

---

## Infrastructure

**Configuration** — `src/config/environment.ts` is the single `process.env` reader. New variables: add to `.env.example`, the interface, and the object with a safe default. TypeScript catches stale references at compile time.

**Reporting** — HTML report generated after every run. Trace captured `on-first-retry` (available for the first unexplained CI failure, zero overhead on clean runs). Screenshots and video retained on failure only. Report artifact uploaded to GitHub Actions with 14-day retention.

**CI** — GitHub Actions (`workflow_dispatch`) with a tag-filter dropdown. Pipeline: `typecheck → lint → API tests → UI tests → E2E tests → upload report`. Ready to add `on: pull_request` or `on: schedule` in one line. A second `docker` job builds the image and runs `@smoke` to validate the container is always functional.

**Docker** — Base image `mcr.microsoft.com/playwright:v1.48.0-jammy` (all browser OS dependencies pre-installed). Node 22 is layered on top (required for faker v10 ESM compatibility). Dependencies are installed from the public npm registry. `CI=true` is baked into the image. `docker-compose.yml` mounts reports to the host and defaults to the public ParaBank demo — zero config required.
