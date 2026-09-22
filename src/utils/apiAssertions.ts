import { APIResponse, expect } from '@playwright/test';

export function assertResponseIsSuccessful(response: APIResponse): void {
  expect(
    response.ok(),
    `Expected a successful HTTP response, but got status ${response.status()}`,
  ).toBeTruthy();
}

export function assertFieldEquals<TFieldValue>(
  actualValue: TFieldValue,
  expectedValue: TFieldValue,
  fieldDescription: string,
): void {
  expect(actualValue, fieldDescription).toBe(expectedValue);
}

export function assertFieldIsPresent(actualValue: unknown, fieldDescription: string): void {
  expect(actualValue, fieldDescription).toBeTruthy();
}

export function assertArrayIsNotEmpty<TItem>(actualArray: TItem[], arrayDescription: string): void {
  expect(actualArray.length, arrayDescription).toBeGreaterThan(0);
}

export function assertResponseHasStatus(
  response: APIResponse,
  expectedStatus: number,
  responseDescription: string,
): void {
  expect(response.status(), responseDescription).toBe(expectedStatus);
}
