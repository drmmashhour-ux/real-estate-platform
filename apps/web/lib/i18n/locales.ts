import { getDirection } from "@/lib/i18n/direction";
import {
  isLocaleCode,
  LOCALE_META,
  type LocaleCode,
  UI_LOCALE_CODES,
  UI_LOCALES,
} from "@/lib/i18n/types";

export {
  getDirection,
  isLocaleCode,
  LOCALE_META,
  UI_LOCALE_CODES,
  UI_LOCALES,
  type LocaleCode,
};

/** Cookie name for UI language (client + optional middleware later). */
export const LOCALE_COOKIE = "mi_locale";

/** Display + BCP-47 metadata per locale code (for switcher, SSR html attrs). */
export const UI_LOCALE_ENTRIES: Array<{
  code: LocaleCode;
  label: string;
  bcp47: string;
  rtl: boolean;
}> = [
  { code: "en", label: LOCALE_META.en.label, bcp47: "en", rtl: false },
  { code: "fr", label: LOCALE_META.fr.label, bcp47: "fr", rtl: false },
  { code: "ar", label: LOCALE_META.ar.label, bcp47: "ar", rtl: true },
];

export function parseLocaleCookie(cookieHeader: string | null): LocaleCode {
  if (!cookieHeader) return "en";
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  const raw = m?.[1] ? decodeURIComponent(m[1].trim()) : "";
  const found = UI_LOCALE_ENTRIES.find((l) => l.code === raw);
  return found?.code ?? "en";
}

/** Server Components: read locale from Next.js cookies(). */
export function getLocaleFromCookieStore(cookieStore: {
  get: (name: string) => { value: string } | undefined;
}): LocaleCode {
  const raw = cookieStore.get(LOCALE_COOKIE)?.value ?? "";
  const found = UI_LOCALE_ENTRIES.find((l) => l.code === (raw as LocaleCode));
  return found?.code ?? "en";
}
