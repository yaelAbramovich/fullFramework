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

export interface EnvironmentConfiguration {
  uiBaseUrl: string;
  apiBaseUrl: string;
  validUsername: string;
  validPassword: string;
  defaultActionTimeoutMs: number;
  defaultNavigationTimeoutMs: number;
  logLevel: SupportedLogLevel;
}

export const environmentConfiguration: EnvironmentConfiguration = {
  uiBaseUrl: readStringEnvironmentVariableOrDefault(
    'UI_BASE_URL',
    'https://parabank.parasoft.com/parabank',
  ),
  apiBaseUrl: readStringEnvironmentVariableOrDefault(
    'API_BASE_URL',
    'https://parabank.parasoft.com/parabank/services/bank/',
  ),
  validUsername: readStringEnvironmentVariableOrDefault('VALID_USERNAME', 'john'),
  validPassword: readStringEnvironmentVariableOrDefault('VALID_PASSWORD', 'demo'),
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
