import englishStrings from '../locales/en.json';
import { environmentConfiguration, SupportedLocale } from '../config/environment';

type LocaleStringBundle = typeof englishStrings;

const localeToStringBundle: Record<SupportedLocale, LocaleStringBundle> = {
  en: englishStrings,
};

function getStringBundleForCurrentLocale(): LocaleStringBundle {
  return localeToStringBundle[environmentConfiguration.locale];
}

function resolveDotNotatedKeyAgainstBundle(
  bundle: unknown,
  dotNotatedKey: string,
): string {
  const keySegments = dotNotatedKey.split('.');
  let currentValue: unknown = bundle;

  for (const segment of keySegments) {
    if (
      currentValue === null ||
      typeof currentValue !== 'object' ||
      !(segment in (currentValue as Record<string, unknown>))
    ) {
      throw new Error(
        `String key "${dotNotatedKey}" was not found in the current locale bundle.`,
      );
    }
    currentValue = (currentValue as Record<string, unknown>)[segment];
  }

  if (typeof currentValue !== 'string') {
    throw new Error(
      `String key "${dotNotatedKey}" does not resolve to a string value.`,
    );
  }
  return currentValue;
}

function substitutePlaceholdersInTemplate(
  templateString: string,
  placeholderValues: Record<string, string | number>,
): string {
  return templateString.replace(/\{(\w+)\}/g, (_match, placeholderName) => {
    if (!(placeholderName in placeholderValues)) {
      throw new Error(
        `Missing value for placeholder "{${placeholderName}}" while resolving template: "${templateString}"`,
      );
    }
    return String(placeholderValues[placeholderName]);
  });
}

/**
 * Resolves a dot-notated key (e.g. "pages.login.pageTitle") against the active
 * locale bundle and optionally substitutes {placeholders} with provided values.
 */
export function resolveString(
  dotNotatedKey: string,
  placeholderValues?: Record<string, string | number>,
): string {
  const rawString = resolveDotNotatedKeyAgainstBundle(
    getStringBundleForCurrentLocale(),
    dotNotatedKey,
  );
  if (placeholderValues === undefined) {
    return rawString;
  }
  return substitutePlaceholdersInTemplate(rawString, placeholderValues);
}
