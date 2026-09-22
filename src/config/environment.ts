import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export type SupportedLogLevel = 'debug' | 'info' | 'warn' | 'error';

function readEnvironmentVariableOrUndefined(variableName: string): string | undefined {
  const rawValue = process.env[variableName];
  if (rawValue === undefined || rawValue.trim() === '') return undefined;
  return rawValue.trim();
}

function readStringEnvironmentVariableOrDefault(
  variableName: string,
  defaultValue: string,
): string {
  return readEnvironmentVariableOrUndefined(variableName) ?? defaultValue;
}

function readNumericEnvironmentVariableOrDefault(
  variableName: string,
  defaultValue: number,
): number {
  const rawValue = readEnvironmentVariableOrUndefined(variableName);
  if (rawValue === undefined) return defaultValue;
  const parsedValue = Number(rawValue);
  if (Number.isNaN(parsedValue)) throw new Error(
      `Environment variable "${variableName}" must be a number but got "${rawValue}"`,
    )
  return parsedValue;
}

export type SupportedTestEnvironment = 'local' | 'qa' | 'stage';

function readTestEnvironment(): SupportedTestEnvironment {
  const rawValue = readStringEnvironmentVariableOrDefault('ENV', 'local');
  if (rawValue !== 'local' && rawValue !== 'qa' && rawValue !== 'stage') {
    throw new Error(
      `Environment variable "ENV" must be one of "local", "qa", "stage" but got "${rawValue}"`,
    );
  }
  return rawValue;
}

function readEnvironmentScopedVariableOrDefault(
  variableBaseName: string,
  testEnvironment: SupportedTestEnvironment,
  defaultValue: string,
): string {
  return readStringEnvironmentVariableOrDefault(
    `${variableBaseName}_${testEnvironment.toUpperCase()}`,
    defaultValue,
  );
}

function readRequiredEnvironmentScopedVariable(
  variableBaseName: string,
  testEnvironment: SupportedTestEnvironment,
): string {
  const scopedVariableName = `${variableBaseName}_${testEnvironment.toUpperCase()}`;
  const rawValue = readEnvironmentVariableOrUndefined(scopedVariableName);
  if (rawValue === undefined) {
    throw new Error(
      `Environment variable "${scopedVariableName}" is required but was not set. Add it to your .env file.`,
    );
  }
  return rawValue;
}

export interface EnvironmentConfiguration {
  testEnvironment: SupportedTestEnvironment;
  uiBaseUrl: string;
  apiBaseUrl: string;
  uiUsername: string;
  uiPassword: string;
  shopApiBaseUrl: string;
  shopApiUsername: string;
  shopApiPassword: string;
  defaultActionTimeoutMs: number;
  defaultNavigationTimeoutMs: number;
  logLevel: SupportedLogLevel;
}

const testEnvironment = readTestEnvironment();

export const environmentConfiguration: EnvironmentConfiguration = {
  testEnvironment,
  uiBaseUrl: readStringEnvironmentVariableOrDefault(
    'UI_BASE_URL',
    'https://the-internet.herokuapp.com',
  ),
  apiBaseUrl: readStringEnvironmentVariableOrDefault(
    'API_BASE_URL',
    'https://jsonplaceholder.typicode.com',
  ),
  uiUsername: readStringEnvironmentVariableOrDefault('UI_USERNAME', 'tomsmith'),
  uiPassword: readStringEnvironmentVariableOrDefault('UI_PASSWORD', 'SuperSecretPassword!'),
  shopApiBaseUrl: readEnvironmentScopedVariableOrDefault(
    'SHOP_API_BASE_URL',
    testEnvironment,
    'https://dummyjson.com',
  ),
  shopApiUsername: readEnvironmentScopedVariableOrDefault(
    'SHOP_API_USERNAME',
    testEnvironment,
    'emilys',
  ),
  shopApiPassword: readRequiredEnvironmentScopedVariable('SHOP_API_PASSWORD', testEnvironment),
  defaultActionTimeoutMs: readNumericEnvironmentVariableOrDefault(
    'DEFAULT_ACTION_TIMEOUT_MS',
    10_000,
  ),
  defaultNavigationTimeoutMs: readNumericEnvironmentVariableOrDefault(
    'DEFAULT_NAVIGATION_TIMEOUT_MS',
    30_000,
  ),
  logLevel: readStringEnvironmentVariableOrDefault('LOG_LEVEL', 'info') as SupportedLogLevel,
};
