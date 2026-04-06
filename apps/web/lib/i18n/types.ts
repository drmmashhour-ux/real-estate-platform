/**
 * Canonical UI locale codes for web (and mobile parity).
 * English default; French LTR; Arabic RTL.
 */
export const UI_LOCALES = ["en", "fr", "ar"] as const;

export type LocaleCode = (typeof UI_LOCALES)[number];

/** @deprecated Use `UI_LOCALES` */
export const UI_LOCALE_CODES = UI_LOCALES;

export function isLocaleCode(raw: string | null | undefined): raw is LocaleCode {
  return raw != null && (UI_LOCALES as readonly string[]).includes(raw);
}

export const LOCALE_META = {
  en: { label: "English", dir: "ltr" as const },
  fr: { label: "Français", dir: "ltr" as const },
  ar: { label: "العربية", dir: "rtl" as const },
} satisfies Record<LocaleCode, { label: string; dir: "ltr" | "rtl" }>;
