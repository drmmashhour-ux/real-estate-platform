"use client";

import { useEffect } from "react";
import { LOCALE_COOKIE, UI_LOCALE_ENTRIES, type LocaleCode } from "@/lib/i18n/locales";

/**
 * @deprecated UNUSED — not imported anywhere. Do NOT mount this component:
 * it reads dir from cookie independently, which can conflict with the
 * server-rendered dir from root layout.tsx and I18nContext.tsx useLayoutEffect.
 *
 * Root layout sets dir from getLocale() (server) and I18nContext syncs on
 * client via useLayoutEffect. This component would create a third source of
 * truth and cause visible dir flashes.
 *
 * Kept for reference only. Remove in future cleanup.
 */
export function LocaleAttributes() {
  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
    const raw = m?.[1] ? decodeURIComponent(m[1]) : "en";
    const entry = UI_LOCALE_ENTRIES.find((l) => l.code === (raw as LocaleCode)) ?? UI_LOCALE_ENTRIES[0];
    document.documentElement.lang = entry.bcp47;
    document.documentElement.dir = entry.rtl ? "rtl" : "ltr";
  }, []);
  return null;
}
