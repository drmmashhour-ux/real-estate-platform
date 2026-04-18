import { DARLINK_DEFAULT_LOCALE, DARLINK_LOCALES } from "./config";
import type { DarlinkLocale, TextDirection } from "./types";

export function isDarlinkLocale(value: string | undefined | null): value is DarlinkLocale {
  return value === "ar" || value === "en";
}

export function normalizeLocale(value: string | undefined | null): DarlinkLocale {
  if (isDarlinkLocale(value)) return value;
  return DARLINK_DEFAULT_LOCALE;
}

export function localeDirection(locale: DarlinkLocale): TextDirection {
  return locale === "ar" ? "rtl" : "ltr";
}

export function fallbackLocaleChain(requested: string | undefined): DarlinkLocale[] {
  const n = normalizeLocale(requested);
  if (n === DARLINK_DEFAULT_LOCALE) return [DARLINK_DEFAULT_LOCALE, ...DARLINK_LOCALES.filter((l) => l !== n)];
  return [n, DARLINK_DEFAULT_LOCALE];
}
