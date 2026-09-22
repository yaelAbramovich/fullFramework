# Full Framework

TypeScript + Playwright automation framework supporting UI and API tests, with environment-based configuration (local / qa / stage).

## Setup

```bash
npm install
npx playwright install chromium          # add firefox/webkit for full cross-browser UI runs

cp .env.example .env                     # then fill in SHOP_API_PASSWORD_* — required, no default
```

`.env` is gitignored — it never gets committed, so real credentials stay out of source control.

## Running the tests

```bash
npm test                                 # everything (all projects)
npm run test:api                         # API tests only (tests/api)
npm run test:ui                          # UI tests only (tests/ui)
```

Run a single file / project / test title:

```bash
npx playwright test tests/api/shop-flow.spec.ts
npx playwright test --project=api
npx playwright test -g "invalid credentials"
```

### Choosing an environment

Environment selection is a single env var, `ENV` (`local` | `qa` | `stage`, defaults to `local`). It picks which `*_LOCAL` / `*_QA` / `*_STAGE` values from `.env` are used — no code or test changes needed:

```bash
ENV=qa npm test
ENV=stage npm run test:api
```

## Other commands

```bash
npm run typecheck                        # tsc --noEmit
npm run lint                             # eslint . (no-floating-promises enforced)
npm run test:headed                      # UI in headed mode
npm run test:debug                       # Playwright inspector
npm run report                           # open the last HTML report
```

## Project structure

See `CLAUDE.md` for the full architecture and framework conventions (page objects, API clients, fixtures, strings.json, etc.).
