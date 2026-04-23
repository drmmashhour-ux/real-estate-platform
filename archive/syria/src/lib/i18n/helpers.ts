import { SYRIA_I18N_CONFIG, SYRIA_SUPPORTED_LOCALES } from "./config";
import type { LocalizedText, SyriaDirection, SyriaLocale } from "./types";

export function isRtlLocale(locale: string | undefined | null): boolean {
  return normalizeSyriaLocale(locale) === "ar";
}

export function getLocaleDirection(locale: string | undefined | null): SyriaDirection {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

export function normalizeSyriaLocale(value: string | undefined | null): SyriaLocale {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (v === "ar" || v.startsWith("ar-")) return "ar";
  if (v === "en" || v.startsWith("en-")) return "en";
  return SYRIA_I18N_CONFIG.defaultLocale;
}

/** Alias — resolves arbitrary input to a supported Syria locale. */
export function resolveSyriaLocale(input: string | undefined | null): SyriaLocale {
  return normalizeSyriaLocale(input);
}

/**
 * Localized field resolution: EN falls back to AR when missing; AR never falls back to EN.
 */
export function getLocalizedValue(
  value: LocalizedText | null | undefined,
  locale: SyriaLocale,
  fallbackLocale: SyriaLocale = "ar",
): string {
  try {
    if (!value || typeof value.ar !== "string") return "";
    const ar = value.ar.trim();
    if (locale === "ar") return ar;
    const en = typeof value.en === "string" ? value.en.trim() : "";
    if (en) return en;
    const fb =
      fallbackLocale === "ar"
        ? ar
        : (typeof value.en === "string" ? value.en.trim() : "") || ar;
    return fb || ar;
  } catch {
    return "";
  }
}

/** @deprecated use normalizeSyriaLocale */
export function isDarlinkLocale(value: string | undefined | null): value is SyriaLocale {
  return value === "ar" || value === "en";
}

/** @deprecated use normalizeSyriaLocale */
export function normalizeLocale(value: string | undefined | null): SyriaLocale {
  return normalizeSyriaLocale(value);
}

/** @deprecated use getLocaleDirection */
export function localeDirection(locale: SyriaLocale): SyriaDirection {
  return getLocaleDirection(locale);
}

export function fallbackLocaleChain(requested: string | undefined): SyriaLocale[] {
  const n = normalizeSyriaLocale(requested);
  if (n === SYRIA_I18N_CONFIG.defaultLocale) {
    return [n, ...SYRIA_SUPPORTED_LOCALES.filter((l) => l !== n)];
  }
  return [n, SYRIA_I18N_CONFIG.defaultLocale];
}
