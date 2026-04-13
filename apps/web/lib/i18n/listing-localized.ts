import type { LocaleCode } from "@/lib/i18n/types";

export type LocalizedStrings = {
  en: string;
  fr?: string | null;
  ar?: string | null;
};

/** Picks best copy for UI locale with fallback to English. */
export function pickLocalizedField(
  locale: LocaleCode,
  en: string,
  fr?: string | null,
  ar?: string | null
): string {
  if (locale === "fr" && fr != null && String(fr).trim() !== "") {
    return String(fr);
  }
  if (locale === "ar" && ar != null && String(ar).trim() !== "") {
    return String(ar);
  }
  return en;
}

export function pickLocalizedFromRecord(locale: LocaleCode, s: LocalizedStrings): string {
  return pickLocalizedField(locale, s.en, s.fr, s.ar);
}
