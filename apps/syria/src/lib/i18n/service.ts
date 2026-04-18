/**
 * Thin facade over next-intl message loading — single import surface for Darlink.
 */
import type { DarlinkLocale } from "./types";
import arMessages from "./messages/ar";
import enMessages from "./messages/en";

const byLocale = {
  ar: arMessages,
  en: enMessages,
} as const;

export function getDarlinkMessages(locale: DarlinkLocale) {
  return byLocale[locale] ?? byLocale.ar;
}
