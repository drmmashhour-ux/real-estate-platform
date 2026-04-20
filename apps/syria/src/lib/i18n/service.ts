/**
 * Syria i18n — thin facades: next-intl message trees + direct `t()` for non-React call sites.
 */
import { normalizeSyriaLocale } from "./helpers";
import type { DarlinkLocale, SyriaLocale } from "./types";
import arMessages from "./messages/ar";
import enMessages from "./messages/en";

const byLocale = {
  ar: arMessages,
  en: enMessages,
} as const;

export function getSyriaMessages(locale: SyriaLocale) {
  return byLocale[normalizeSyriaLocale(locale)] ?? byLocale.ar;
}

/** @deprecated use getSyriaMessages */
export function getDarlinkMessages(locale: DarlinkLocale) {
  return getSyriaMessages(locale);
}

export function getSyriaTranslator(locale: SyriaLocale) {
  const messages = getSyriaMessages(locale);
  return function translate(namespace: string, key: string): string {
    try {
      const bucket = messages as Record<string, Record<string, unknown>>;
      const ns = bucket[namespace];
      const raw = ns?.[key];
      return typeof raw === "string" ? raw : String(key);
    } catch {
      return String(key);
    }
  };
}

export function t(namespace: string, key: string, locale: SyriaLocale): string {
  return getSyriaTranslator(locale)(namespace, key);
}
