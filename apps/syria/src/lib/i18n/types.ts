/** Supported Syria (Darlink) locales — Arabic is default and required for authored listing content. */
export type SyriaLocale = "ar" | "en";

/** Document / layout direction for RTL (Arabic) vs LTR (English). */
export type SyriaDirection = "rtl" | "ltr";

/** Bilingual string bag — Arabic required for listing copy; English optional. */
export type LocalizedText = {
  ar: string;
  en?: string | null;
};

export type SyriaI18nConfig = {
  defaultLocale: SyriaLocale;
  supportedLocales: SyriaLocale[];
};

/** @deprecated use SyriaLocale — kept for next-intl / existing imports. */
export type DarlinkLocale = SyriaLocale;

/** @deprecated use SyriaDirection */
export type TextDirection = SyriaDirection;

/** next-intl namespaces mirror message JSON top-level keys (includes legacy PascalCase keys). */
export type MessageNamespaces =
  | "Common"
  | "Metadata"
  | "nav"
  | "Footer"
  | "PlatformDisabled"
  | "home"
  | "NotFound"
  | "Buy"
  | "Rent"
  | "Bnhub"
  | "Sell"
  | "Listing"
  | "Login"
  | "Dashboard"
  | "Admin"
  | "Browse"
  | "common"
  | "listing"
  | "sell"
  | "dashboard"
  | "admin"
  | "booking"
  | "payments";
