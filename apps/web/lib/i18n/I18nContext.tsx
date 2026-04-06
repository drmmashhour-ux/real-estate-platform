"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LOCALE_COOKIE, UI_LOCALE_ENTRIES, type LocaleCode } from "@/lib/i18n/locales";
import { UI_LOCALES } from "@/lib/i18n/types";
import { interpolateMessage } from "@/lib/i18n/interpolate";
import { MESSAGES } from "@/lib/i18n/messages";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type I18nContextValue = {
  locale: LocaleCode;
  /** Locales permitted by launch flags (English always allowed when passed from server). */
  allowedLocales: LocaleCode[];
  setLocale: (next: LocaleCode) => void;
  t: TranslateFn;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function applyHtmlLang(code: LocaleCode) {
  const entry = UI_LOCALE_ENTRIES.find((l) => l.code === code) ?? UI_LOCALE_ENTRIES[0];
  document.documentElement.lang = entry.bcp47;
  document.documentElement.dir = entry.rtl ? "rtl" : "ltr";
}

function lookup(key: string, code: LocaleCode): string | undefined {
  const primary = MESSAGES[code]?.[key];
  if (primary !== undefined && primary !== "") return primary;
  return MESSAGES.en[key];
}


function normalizeAllowedLocales(list: LocaleCode[] | undefined): LocaleCode[] {
  const uniq = new Set<LocaleCode>(list?.length ? list : [...UI_LOCALES]);
  if (!uniq.has("en")) uniq.add("en");
  return [...UI_LOCALES].filter((c) => uniq.has(c));
}

export function I18nProvider({
  children,
  initialLocale,
  allowedLocales,
}: {
  children: ReactNode;
  initialLocale: LocaleCode;
  /** Omit to allow all `UI_LOCALES` (used when launch flags not wired). */
  allowedLocales?: LocaleCode[];
}) {
  const allowed = useMemo(() => normalizeAllowedLocales(allowedLocales), [allowedLocales]);
  const [locale, setLocaleState] = useState<LocaleCode>(() =>
    allowed.includes(initialLocale) ? initialLocale : "en",
  );
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useLayoutEffect(() => {
    applyHtmlLang(locale);
  }, [locale]);

  useLayoutEffect(() => {
    if (!allowed.includes(locale)) {
      setLocaleState("en");
      applyHtmlLang("en");
    }
  }, [allowed, locale]);

  const setLocale = useCallback(
    (next: LocaleCode) => {
    const safe = allowed.includes(next) ? next : "en";
    const prev = localeRef.current;
    if (prev !== safe) {
      void fetch("/api/growth/manager-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          event: "language_switched",
          locale: safe,
          metadata: { from: prev, to: safe },
        }),
      }).catch(() => {});
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("[i18n] language:", safe);
    }
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${safe};path=/;max-age=${maxAge};SameSite=Lax`;
    try {
      localStorage.setItem(LOCALE_COOKIE, safe);
    } catch {
      /* private mode / quota */
    }
    applyHtmlLang(safe);
    setLocaleState(safe);
    void fetch("/api/me/ui-locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ locale: safe }),
    }).catch(() => {});
  },
    [allowed],
  );

  const t = useCallback<TranslateFn>(
    (key, vars) => {
      const raw = lookup(key, locale) ?? lookup(key, "en") ?? key;
      return interpolateMessage(raw, vars);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, allowedLocales: allowed, setLocale, t }),
    [locale, allowed, setLocale, t],
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
