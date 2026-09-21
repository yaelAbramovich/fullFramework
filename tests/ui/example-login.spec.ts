import { test } from '../../src/infrastructure/fixtures';
import { environmentConfiguration } from '../../src/config/environment';
import strings from '../../src/utils/strings.json';

test('logs in with valid credentials and shows the success message', async ({ exampleLoginPage }) => {
  await exampleLoginPage.open();
  await exampleLoginPage.loginWith(environmentConfiguration.uiUsername, environmentConfiguration.uiPassword);

  await exampleLoginPage.assertFlashMessageContains(strings.pages.loggedIn.successFlashMessageFragment);
});
