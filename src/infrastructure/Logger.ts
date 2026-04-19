import { environmentConfiguration, SupportedLogLevel } from '../config/environment';

const logLevelSeverityOrder: Record<SupportedLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLogAtLevel(messageLevel: SupportedLogLevel): boolean {
  const configuredSeverity = logLevelSeverityOrder[environmentConfiguration.logLevel];
  const messageSeverity = logLevelSeverityOrder[messageLevel];
  return messageSeverity >= configuredSeverity;
}

function buildFormattedLogLine(
  loggerName: string,
  level: SupportedLogLevel,
  message: string,
): string {
  const timestamp = new Date().toISOString();
  const levelLabel = level.toUpperCase().padEnd(5, ' ');
  return `[${timestamp}] [${levelLabel}] [${loggerName}] ${message}`;
}

export class Logger {
  private readonly loggerName: string;

  constructor(loggerName: string) {
    this.loggerName = loggerName;
  }

  public debug(message: string): void {
    if (shouldLogAtLevel('debug')) {
      console.debug(buildFormattedLogLine(this.loggerName, 'debug', message));
    }
  }

  public info(message: string): void {
    if (shouldLogAtLevel('info')) {
      console.info(buildFormattedLogLine(this.loggerName, 'info', message));
    }
  }

  public warn(message: string): void {
    if (shouldLogAtLevel('warn')) {
      console.warn(buildFormattedLogLine(this.loggerName, 'warn', message));
    }
  }

  public error(message: string, cause?: unknown): void {
    if (!shouldLogAtLevel('error')) {
      return;
    }
    console.error(buildFormattedLogLine(this.loggerName, 'error', message));
    if (cause !== undefined) {
      console.error(cause);
    }
  }
}
