"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_COOKIE, UI_LOCALE_ENTRIES, type LocaleCode } from "@/lib/i18n/locales";
import { routing } from "@/i18n/routing";
import { UI_LOCALES } from "@/lib/i18n/types";

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type I18nContextValue = {
  locale: LocaleCode;
  /** Locales permitted by launch flags (English always allowed when passed from server). */
  allowedLocales: LocaleCode[];
  setLocale: (next: LocaleCode) => void;
  t: TranslateFn;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function normalizeAllowedLocales(list: LocaleCode[] | undefined): LocaleCode[] {
  const uniq = new Set<LocaleCode>(list?.length ? list : [...UI_LOCALES]);
  if (!uniq.has("en")) uniq.add("en");
  return [...UI_LOCALES].filter((c) => uniq.has(c));
}

function routingSafeLocale(code: LocaleCode): (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(code)
    ? (code as (typeof routing.locales)[number])
    : routing.defaultLocale;
}

export function I18nProvider({
  children,
  allowedLocales,
}: {
  children: ReactNode;
  /** Omit to allow all `UI_LOCALES` (used when launch flags not wired). */
  allowedLocales?: LocaleCode[];
}) {
  const allowed = useMemo(() => normalizeAllowedLocales(allowedLocales), [allowedLocales]);
  const locale = useLocale() as LocaleCode;
  const router = useRouter();
  const pathname = usePathname();
  const translate = useTranslations();
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useLayoutEffect(() => {
    const entry = UI_LOCALE_ENTRIES.find((l) => l.code === locale) ?? UI_LOCALE_ENTRIES[0];
    document.documentElement.lang = entry.bcp47;
    document.documentElement.dir = entry.rtl ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback(
    (next: LocaleCode) => {
      const safe = allowed.includes(next) ? next : "en";
      const target = routingSafeLocale(safe);
      const prev = localeRef.current;
      if (prev !== target) {
        void fetch("/api/growth/manager-track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            event: "language_switched",
            locale: target,
            metadata: { from: prev, to: target },
          }),
        }).catch(() => {});
      }
      if (process.env.NODE_ENV === "development") {
        console.debug("[i18n] language:", target);
      }
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `${LOCALE_COOKIE}=${target};path=/;max-age=${maxAge};SameSite=Lax`;
      try {
        localStorage.setItem(LOCALE_COOKIE, target);
      } catch {
        /* private mode / quota */
      }
      void fetch("/api/me/ui-locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ locale: target }),
      }).catch(() => {});

      router.replace(pathname, { locale: target });
    },
    [allowed, router, pathname],
  );

  const t = useCallback<TranslateFn>(
    (key, vars) => {
      try {
        return translate(key as never, vars as never);
      } catch {
        return key;
      }
    },
    [translate],
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
