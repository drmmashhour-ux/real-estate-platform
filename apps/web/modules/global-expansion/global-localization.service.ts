import { getCountryConfig } from "./global-country.service";

const UI_STRINGS: Record<string, Record<string, string>> = {
  "dashboard.title": {
    en: "Global expansion",
    fr: "Expansion mondiale",
    ar: "التوسع العالمي",
  },
  "market.language.base": {
    en: "English (base copy)",
    fr: "Français",
    ar: "العربية (مستقبلاً)",
  },
  "content.marketing.tone": {
    en: "Direct value + proof; adapt tone per market counsel",
    fr: "Preuve + conformité marketing locale",
    ar: "التوافق المحلي أولاً — مترجم",
  },
};

/** Resolve UI key for a BCP-47 style locale (en, fr, ar). Falls back to English. */
export function tUi(key: string, locale: string): string {
  const l = locale.split("-")[0]?.toLowerCase() ?? "en";
  const pack = UI_STRINGS[key];
  if (!pack) return key;
  return pack[l] ?? pack.en ?? key;
}

export function supportedLocalesForCountry(countryCode: string): string[] {
  return getCountryConfig(countryCode)?.supportedLanguages?.length
    ? [...(getCountryConfig(countryCode)!.supportedLanguages as unknown as string[])]
    : ["en"];
}

export function defaultLocaleForCountry(countryCode: string): string {
  return getCountryConfig(countryCode)?.defaultLanguage ?? "en";
}

export type ContentAdaptationHint = { locale: string; notes: string };

/** Marketing / content adaptation checklist — not auto-translation. */
export function marketingAdaptationPlan(countryCode: string, locale: string): ContentAdaptationHint {
  return {
    locale,
    notes:
      `For ${countryCode}: adapt headlines and CTAs using ${tUi("content.marketing.tone", locale)}; ` +
      "route legal and brand review for paid channels before publish.",
  };
}
