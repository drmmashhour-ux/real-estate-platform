"use client";

import { useEffect } from "react";
import { LOCALE_COOKIE, UI_LOCALES, type LocaleCode } from "@/lib/i18n/locales";

/**
 * Syncs <html lang> and dir (LTR/RTL) from mi_locale cookie on mount.
 * Full copy translation is a separate effort; this prevents layout breakage for Arabic.
 */
export function LocaleAttributes() {
  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
    const raw = m?.[1] ? decodeURIComponent(m[1]) : "en";
    const entry = UI_LOCALES.find((l) => l.code === (raw as LocaleCode)) ?? UI_LOCALES[0];
    document.documentElement.lang = entry.bcp47;
    document.documentElement.dir = entry.rtl ? "rtl" : "ltr";
  }, []);
  return null;
}
