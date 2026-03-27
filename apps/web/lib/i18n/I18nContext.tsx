"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LOCALE_COOKIE, UI_LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import { MESSAGES } from "@/lib/i18n/messages";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (next: LocaleCode) => void;
  t: TranslateFn;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function applyHtmlLang(code: LocaleCode) {
  const entry = UI_LOCALES.find((l) => l.code === code) ?? UI_LOCALES[0];
  document.documentElement.lang = entry.bcp47;
  document.documentElement.dir = entry.rtl ? "rtl" : "ltr";
}

function lookup(key: string, code: LocaleCode): string | undefined {
  const primary = MESSAGES[code]?.[key];
  if (primary !== undefined && primary !== "") return primary;
  return MESSAGES.en[key];
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: LocaleCode;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>(initialLocale);

  useLayoutEffect(() => {
    applyHtmlLang(locale);
  }, [locale]);

  const setLocale = useCallback((next: LocaleCode) => {
    const safe = UI_LOCALES.some((l) => l.code === next) ? next : "en";
    if (process.env.NODE_ENV === "development") {
      console.debug("[i18n] language:", safe);
    }
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${safe};path=/;max-age=${maxAge};SameSite=Lax`;
    applyHtmlLang(safe);
    setLocaleState(safe);
  }, []);

  const t = useCallback<TranslateFn>(
    (key, vars) => {
      const raw = lookup(key, locale) ?? lookup(key, "en") ?? key;
      return interpolate(raw, vars);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
