import * as Localization from "expo-localization";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { I18nManager } from "react-native";
import { flattenMessageTree } from "./flatten";
import ar from "../locales/ar.json";
import en from "../locales/en.json";
import fr from "../locales/fr.json";

export type MobileLocaleCode = "en" | "fr" | "ar";

const DICTS: Record<MobileLocaleCode, Record<string, string>> = {
  en: flattenMessageTree(en as Record<string, unknown>),
  fr: flattenMessageTree(fr as Record<string, unknown>),
  ar: flattenMessageTree(ar as Record<string, unknown>),
};

function deviceDefaultLocale(): MobileLocaleCode {
  const tag = (Localization.getLocales()[0]?.languageCode ?? "en").toLowerCase();
  if (tag === "ar") return "ar";
  if (tag === "fr") return "fr";
  return "en";
}

function applyRtl(code: MobileLocaleCode) {
  const rtl = code === "ar"; /* fr and en stay LTR */
  if (I18nManager.isRTL === rtl) return;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(rtl);
}

type Ctx = {
  locale: MobileLocaleCode;
  setLocale: (c: MobileLocaleCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isRtl: boolean;
};

const I18nCtx = createContext<Ctx | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  return out;
}

export function MobileI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<MobileLocaleCode>(deviceDefaultLocale);

  useLayoutEffect(() => {
    applyRtl(locale);
  }, [locale]);

  const setLocale = useCallback((next: MobileLocaleCode) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = DICTS[locale][key] ?? DICTS.en[key] ?? key;
      return interpolate(raw, vars);
    },
    [locale],
  );

  const value = useMemo<Ctx>(
    () => ({
      locale,
      setLocale,
      t,
      isRtl: locale === "ar",
    }),
    [locale, setLocale, t],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useMobileI18n(): Ctx {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useMobileI18n must be used within MobileI18nProvider");
  return ctx;
}
