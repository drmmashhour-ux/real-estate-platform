/**
 * Localization bundle: language, currency, and UX adaptation hints per market.
 * Uses platform locale list + expansion country config; not a full i18n runtime.
 */

import { UI_LOCALE_ENTRIES } from "@/lib/i18n/locales";
import { formatCurrencyDisplay } from "@/modules/global-expansion/global-currency.service";
import {
  defaultLocaleForCountry,
  marketingAdaptationPlan,
  supportedLocalesForCountry,
  tUi,
} from "@/modules/global-expansion/global-localization.service";
import { getCountryConfig } from "@/modules/global-expansion/global-country.service";

export type MarketLocalizationProfile = {
  countryCode: string;
  defaultLocale: string;
  supportedLocales: string[];
  bcp47Options: { code: string; label: string; rtl: boolean }[];
  currency: string;
  sampleMoneyFormatted: string;
  uxHints: string[];
};

/**
 * Resolves display locale list, currency, and adaptation hints for a country.
 */
export function resolveMarketLocalizationProfile(
  countryCode: string,
  displayLocale = "en"
): MarketLocalizationProfile {
  const c = getCountryConfig(countryCode);
  if (!c) {
    return {
      countryCode: countryCode.toUpperCase(),
      defaultLocale: "en",
      supportedLocales: ["en"],
      bcp47Options: UI_LOCALE_ENTRIES.map((e) => ({ code: e.bcp47, label: e.label, rtl: e.rtl })),
      currency: "USD",
      sampleMoneyFormatted: new Intl.NumberFormat(displayLocale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(1000),
      uxHints: ["Add country to expansion registry for full profile."],
    };
  }

  const locHint = marketingAdaptationPlan(c.countryCode, defaultLocaleForCountry(c.countryCode));
  const money = formatCurrencyDisplay(1_000_00, c.currency, displayLocale);
  return {
    countryCode: c.countryCode,
    defaultLocale: defaultLocaleForCountry(c.countryCode),
    supportedLocales: supportedLocalesForCountry(c.countryCode),
    bcp47Options: UI_LOCALE_ENTRIES.map((e) => ({ code: e.bcp47, label: e.label, rtl: e.rtl })),
    currency: c.currency,
    sampleMoneyFormatted: money.formatted,
    uxHints: [
      locHint.notes,
      c.defaultLanguage === "ar" || c.supportedLanguages.includes("ar")
        ? "Enable RTL layout and review Arabic string overflow in nav and forms."
        : "Confirm LTR spacing and number formatting match `displayLocale` in checkout.",
      `Timezone anchor for scheduling UX: ${c.timezone}.`,
    ],
  };
}

/**
 * Shorthand for admin tables.
 */
export function formatMarketCurrency(amountCents: number, countryCode: string, displayLocale: string) {
  const c = getCountryConfig(countryCode);
  return formatCurrencyDisplay(amountCents, c?.currency ?? "USD", displayLocale);
}

export { tUi, defaultLocaleForCountry, supportedLocalesForCountry, marketingAdaptationPlan };
