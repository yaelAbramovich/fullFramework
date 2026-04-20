import { expect } from '@playwright/test';
import type { Account } from '../../api/AccountsApiClient';

export function expectAccountBalanceToHaveChangedBy(
  account: Account,
  balanceBefore: number,
  expectedBalanceDelta: number,
): void {
  const expectedBalanceAfter = balanceBefore + expectedBalanceDelta;
  const direction = expectedBalanceDelta < 0 ? 'decrease' : 'increase';
  const amountMagnitude = Math.abs(expectedBalanceDelta);
  expect(
    account.balance,
    `Expected account #${account.id} balance to ${direction} by $${amountMagnitude} (from $${balanceBefore} to $${expectedBalanceAfter}) but got $${account.balance}`,
  ).toBeCloseTo(expectedBalanceAfter, 2);
}
