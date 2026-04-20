import { expect } from '@playwright/test';

export function expectCustomerIdToBeValid(customerId: number): void {
  expect(
    customerId,
    `Expected customer id to be a positive number but got ${customerId}`,
  ).toBeGreaterThan(0);
}
