import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { environmentConfiguration } from '../config/environment';
import { Logger } from '../infrastructure/Logger';
import type { Account, AccountType } from '../api/AccountsApiClient';

const executeFileAsync = promisify(execFile);

const accountTypeCodeByName: Record<AccountType, number> = {
  CHECKING: 0,
  SAVINGS: 1,
  LOAN: 2,
};

export interface CurlBasicAuthCredentials {
  username: string;
  password: string;
}

export interface CreateAccountViaCurlInput {
  customerId: number;
  newAccountType: AccountType;
  fromAccountId: number;
  credentials: CurlBasicAuthCredentials;
}

const logger = new Logger('CreateAccountViaCurl');

export async function createAccountViaCurl(
  input: CreateAccountViaCurlInput,
): Promise<Account> {
  const endpointUrl =
    `${environmentConfiguration.apiBaseUrl}createAccount` +
    `?customerId=${input.customerId}` +
    `&newAccountType=${accountTypeCodeByName[input.newAccountType]}` +
    `&fromAccountId=${input.fromAccountId}`;

  const curlArguments = [
    '-sS',
    '-X',
    'POST',
    '-u',
    `${input.credentials.username}:${input.credentials.password}`,
    '-H',
    'Accept: application/json',
    endpointUrl,
  ];

  logger.info(
    `Running curl POST createAccount (customer ${input.customerId}, type ${input.newAccountType}, from account ${input.fromAccountId})`,
  );

  const { stdout, stderr } = await executeFileAsync('curl', curlArguments);

  if (stderr.trim() !== '') {
    logger.warn(`curl stderr: ${stderr.trim()}`);
  }

  try {
    const createdAccount = JSON.parse(stdout) as Account;
    logger.info(
      `Created account #${createdAccount.id} (type ${createdAccount.type}) for customer ${input.customerId}`,
    );
    return createdAccount;
  } catch (parseError) {
    logger.error(`Failed to parse curl stdout as JSON. Raw: ${stdout}`, parseError);
    throw new Error(
      `createAccount via curl returned non-JSON body: "${stdout.slice(0, 200)}"`,
    );
  }
}
