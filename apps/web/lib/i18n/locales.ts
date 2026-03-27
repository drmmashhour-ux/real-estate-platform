/** Cookie name for UI language (client + optional middleware later). */
export const LOCALE_COOKIE = "mi_locale";

export type LocaleCode = "en" | "fr" | "es" | "ar";

export const UI_LOCALES: Array<{
  code: LocaleCode;
  label: string;
  /** BCP 47 for html lang */
  bcp47: string;
  rtl: boolean;
}> = [
  { code: "en", label: "English", bcp47: "en", rtl: false },
  { code: "fr", label: "Français", bcp47: "fr", rtl: false },
  { code: "es", label: "Español", bcp47: "es", rtl: false },
  { code: "ar", label: "العربية", bcp47: "ar", rtl: true },
];

export function parseLocaleCookie(cookieHeader: string | null): LocaleCode {
  if (!cookieHeader) return "en";
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  const raw = m?.[1] ? decodeURIComponent(m[1].trim()) : "";
  const found = UI_LOCALES.find((l) => l.code === raw);
  return found?.code ?? "en";
}

/** Server Components: read locale from Next.js cookies(). */
export function getLocaleFromCookieStore(cookieStore: {
  get: (name: string) => { value: string } | undefined;
}): LocaleCode {
  const raw = cookieStore.get(LOCALE_COOKIE)?.value ?? "";
  const found = UI_LOCALES.find((l) => l.code === (raw as LocaleCode));
  return found?.code ?? "en";
}
