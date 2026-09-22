import { test } from '../../src/infrastructure/fixtures';
import { environmentConfiguration } from '../../src/config/environment';
import {
  assertResponseIsSuccessful,
  assertFieldEquals,
  assertFieldIsPresent,
  assertArrayIsNotEmpty,
} from '../../src/utils/apiAssertions';

const SHOP_FLOW_TEST_CASES = [
  { searchQuery: 'phone', requestedQuantity: 2 },
  { searchQuery: 'laptop', requestedQuantity: 1 },
  { searchQuery: 'watch', requestedQuantity: 3 },
];

SHOP_FLOW_TEST_CASES.forEach(({ searchQuery, requestedQuantity }) => {
  test(`Shop flow: login, get current user, search "${searchQuery}", add ${requestedQuantity} to cart`, async ({
    authApiClient,
    productsApiClient,
    cartsApiClient,
  }) => {
    const loginResult = await test.step('Login with valid credentials', async () => {
      const { response, loginResult } = await authApiClient.login(
        environmentConfiguration.shopApiUsername,
        environmentConfiguration.shopApiPassword,
      );

      assertResponseIsSuccessful(response);
      assertFieldEquals(loginResult.username, environmentConfiguration.shopApiUsername, 'logged-in username');
      assertFieldIsPresent(loginResult.accessToken, 'access token');

      return loginResult;
    });

    const userId = await test.step('Get the current authenticated user', async () => {
      const { response, user } = await authApiClient.getCurrentUser(loginResult.accessToken!);

      assertResponseIsSuccessful(response);
      assertFieldIsPresent(user.id, 'current user id');
      assertFieldEquals(user.id, loginResult.id, 'current user id matches the id returned at login');
      assertFieldEquals(user.username, environmentConfiguration.shopApiUsername, 'current user username');

      return user.id;
    });

    const selectedProductId = await test.step('Search products and select one dynamically', async () => {
      const { response, searchResult } = await productsApiClient.searchProducts(searchQuery);

      assertResponseIsSuccessful(response);
      assertArrayIsNotEmpty(searchResult.products, 'search results products');

      const [selectedProduct] = searchResult.products;
      assertFieldIsPresent(selectedProduct.id, 'selected product id');

      return selectedProduct.id;
    });

    await test.step('Add the selected product to the cart', async () => {
      const { response, cart } = await cartsApiClient.addProductToCart(
        userId,
        selectedProductId,
        requestedQuantity,
      );

      assertResponseIsSuccessful(response);
      assertFieldEquals(cart.userId, userId, 'cart user id');

      const [cartProduct] = cart.products;
      assertFieldEquals(cartProduct.id, selectedProductId, 'cart product id');
      assertFieldEquals(cartProduct.quantity, requestedQuantity, 'cart product quantity');

      assertFieldIsPresent(cart.total, 'cart total');
      assertFieldEquals(cart.totalQuantity, requestedQuantity, 'cart total quantity');
    });
  });
});
