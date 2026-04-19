import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import { PageManager } from '../../src/infrastructure/PageManager';
import { environmentConfiguration, AUTH_STATE_PATH } from '../../src/config/environment';

setup('authenticate as default user', async ({ page }) => {
  fs.mkdirSync('.auth', { recursive: true });

  const pageManager = new PageManager(page);
  await pageManager.loginPageInstance().openLoginPage();
  await pageManager.loginPageInstance().submitLoginFormWithCredentials(
    environmentConfiguration.uiUsername,
    environmentConfiguration.uiPassword,
  );
  await pageManager.loggedInSuccessPageInstance().assertSecureAreaHeadingIsVisible();

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
