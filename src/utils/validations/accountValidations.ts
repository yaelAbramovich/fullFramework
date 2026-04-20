import { expect } from '@playwright/test';
import type { Account, AccountType } from '../../api/AccountsApiClient';

export function expectAccountsToIncludeAtLeastOne(
  accounts: Account[],
  customerId: number,
): void {
  expect(
    accounts.length,
    `Expected customer ${customerId} to own at least one account but got ${accounts.length}`,
  ).toBeGreaterThan(0);
}

export function expectAccountToBelongToCustomer(
  account: Account,
  expectedOwnerCustomerId: number,
): void {
  expect(
    account.customerId,
    `Expected account #${account.id} to belong to customer ${expectedOwnerCustomerId} but belongs to customer ${account.customerId}`,
  ).toBe(expectedOwnerCustomerId);
}

export function expectAccountBalanceToBeNonNegative(account: Account): void {
  expect(
    account.balance,
    `Expected account #${account.id} balance to be a non-negative number but got ${account.balance}`,
  ).toBeGreaterThanOrEqual(0);
}

export function expectAccountIdToBePositive(account: Account): void {
  expect(
    account.id,
    `Expected account id to be a positive number but got ${account.id}`,
  ).toBeGreaterThan(0);
}

export function expectAccountIdToDifferFrom(
  account: Account,
  otherAccountId: number,
): void {
  expect(
    account.id,
    `Expected account id to differ from account #${otherAccountId} but both are #${account.id}`,
  ).not.toBe(otherAccountId);
}

export function expectAccountTypeToBe(
  account: Account,
  expectedAccountType: AccountType,
): void {
  expect(
    account.type,
    `Expected account #${account.id} type to be "${expectedAccountType}" but got "${account.type}"`,
  ).toBe(expectedAccountType);
}
