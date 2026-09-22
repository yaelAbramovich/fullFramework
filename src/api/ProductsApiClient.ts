import { APIRequestContext, APIResponse } from '@playwright/test';
import { ShopApiClient } from './ShopApiClient';
import { HttpMethod } from './BaseApiClient';

export interface Product {
  id: number;
  title: string;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
}

export class ProductsApiClient extends ShopApiClient {
  private static readonly SEARCH_PATH = '/products/search';

  public constructor(requestContext: APIRequestContext) {
    super(requestContext, 'ProductsApiClient');
  }

  public async searchProducts(
    query: string,
  ): Promise<{ response: APIResponse; searchResult: ProductSearchResult }> {
    const response = await this.sendHttpRequest(
      HttpMethod.GET,
      this.buildShopApiUrl(ProductsApiClient.SEARCH_PATH),
      { queryParameters: { q: query } },
    );
    const searchResult = await this.parseResponseAsJson<ProductSearchResult>(response);
    return { response, searchResult };
  }
}
