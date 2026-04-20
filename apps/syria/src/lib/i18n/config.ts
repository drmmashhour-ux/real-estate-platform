import type { SyriaI18nConfig, SyriaLocale } from "./types";

export const SYRIA_SUPPORTED_LOCALES: readonly SyriaLocale[] = ["ar", "en"];

export const SYRIA_I18N_CONFIG: SyriaI18nConfig = {
  defaultLocale: "ar",
  supportedLocales: [...SYRIA_SUPPORTED_LOCALES],
};

/** @deprecated prefer SYRIA_I18N_CONFIG */
export const DARLINK_LOCALES = SYRIA_SUPPORTED_LOCALES;

/** @deprecated */
export const DARLINK_DEFAULT_LOCALE: SyriaLocale = "ar";

/** Cookie name aligned with optional next-intl cookie strategy. */
export const DARLINK_LOCALE_COOKIE = "DARLINK_LOCALE";
