import { test } from '../../src/infrastructure/fixtures';
import { environmentConfiguration } from '../../src/config/environment';

test('logs in with valid credentials and shows the success message', async ({ exampleLoginPage }) => {
  await exampleLoginPage.navigateToLoginPage();
  await exampleLoginPage.submitLoginFormWithCredentials(
    environmentConfiguration.uiUsername,
    environmentConfiguration.uiPassword,
  );

  await exampleLoginPage.assertLoginSuccessMessageIsVisible();
});
