import { APIRequestContext, APIResponse } from '@playwright/test';
import { ShopApiClient } from './ShopApiClient';
import { HttpMethod } from './BaseApiClient';

export interface CartProduct {
  id: number;
  quantity: number;
}

export interface Cart {
  id: number;
  products: CartProduct[];
  userId: number;
  total: number;
  totalQuantity: number;
}

export class CartsApiClient extends ShopApiClient {
  private static readonly ADD_PRODUCT_PATH = '/carts/add';

  public constructor(requestContext: APIRequestContext) {
    super(requestContext, 'CartsApiClient');
  }

  public async addProductToCart(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<{ response: APIResponse; cart: Cart }> {
    const response = await this.sendHttpRequest(
      HttpMethod.POST,
      this.buildShopApiUrl(CartsApiClient.ADD_PRODUCT_PATH),
      { jsonRequestBody: { userId, products: [{ id: productId, quantity }] } },
    );
    const cart = await this.parseResponseAsJson<Cart>(response);
    return { response, cart };
  }
}
