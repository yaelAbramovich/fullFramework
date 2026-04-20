# Official Playwright image — Ubuntu 22.04 (jammy) with all browser OS
# dependencies pre-installed. Pin to the same major.minor as @playwright/test
# in package.json so the image's system libraries are compatible.
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

# The jammy image ships Node 20.18.0. @faker-js/faker v10 requires >=20.19.0,
# and Node 22.12+ is needed for require() of ESM modules to work (faker v10 is
# ESM-only). Upgrade to Node 22 LTS via NodeSource before installing deps.
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies in a separate layer so it is cached on source-only
# changes (package*.json changes far less often than src/).
COPY package.json ./
# package-lock.json resolves packages from a private corporate registry that
# requires auth credentials unavailable inside the container. Copy only
# package.json so npm resolves fresh from the public registry.
RUN npm install --registry=https://registry.npmjs.org

# Re-run browser install after npm ci: npm may resolve a newer patch of
# @playwright/test whose browser revision differs from the pre-bundled binary
# in the base image. The base image already ships all OS deps, so no
# --with-deps flag is needed here.
RUN npx playwright install chromium

# Copy the rest of the project after the dependency layer is sealed.
COPY . .

# Tell Playwright/Node we are running in CI:
#   - retries = 2  (playwright.config.ts: process.env.CI ? 2 : 0)
#   - workers = 1  (playwright.config.ts: process.env.CI ? 1 : undefined)
#   - forbidOnly   (fails if test.only was accidentally committed)
ENV CI=true

CMD ["npx", "playwright", "test"]
