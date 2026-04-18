import type { DarlinkLocale } from "./types";

export const DARLINK_LOCALES: readonly DarlinkLocale[] = ["ar", "en"];

export const DARLINK_DEFAULT_LOCALE: DarlinkLocale = "ar";

/** Cookie name aligned with optional next-intl cookie strategy. */
export const DARLINK_LOCALE_COOKIE = "DARLINK_LOCALE";
