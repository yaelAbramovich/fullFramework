import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export type SupportedLogLevel = 'debug' | 'info' | 'warn' | 'error';
export type SupportedLocale = 'en';

function readStringEnvironmentVariableOrDefault(
  variableName: string,
  defaultValue: string,
): string {
  const rawValue = process.env[variableName];
  if (rawValue === undefined || rawValue.trim() === '') {
    return defaultValue;
  }
  return rawValue.trim();
}

function readNumericEnvironmentVariableOrDefault(
  variableName: string,
  defaultValue: number,
): number {
  const rawValue = process.env[variableName];
  if (rawValue === undefined || rawValue.trim() === '') {
    return defaultValue;
  }
  const parsedValue = Number(rawValue);
  if (Number.isNaN(parsedValue)) {
    throw new Error(
      `Environment variable "${variableName}" must be a number but got "${rawValue}"`,
    );
  }
  return parsedValue;
}

export interface EnvironmentConfiguration {
  uiBaseUrl: string;
  apiBaseUrl: string;
  defaultActionTimeoutMs: number;
  defaultNavigationTimeoutMs: number;
  logLevel: SupportedLogLevel;
  locale: SupportedLocale;
}

export const environmentConfiguration: EnvironmentConfiguration = {
  uiBaseUrl: readStringEnvironmentVariableOrDefault(
    'UI_BASE_URL',
    'https://the-internet.herokuapp.com',
  ),
  apiBaseUrl: readStringEnvironmentVariableOrDefault(
    'API_BASE_URL',
    'https://jsonplaceholder.typicode.com',
  ),
  defaultActionTimeoutMs: readNumericEnvironmentVariableOrDefault(
    'DEFAULT_ACTION_TIMEOUT_MS',
    10_000,
  ),
  defaultNavigationTimeoutMs: readNumericEnvironmentVariableOrDefault(
    'DEFAULT_NAVIGATION_TIMEOUT_MS',
    30_000,
  ),
  logLevel: readStringEnvironmentVariableOrDefault('LOG_LEVEL', 'info') as SupportedLogLevel,
  locale: readStringEnvironmentVariableOrDefault('LOCALE', 'en') as SupportedLocale,
};
