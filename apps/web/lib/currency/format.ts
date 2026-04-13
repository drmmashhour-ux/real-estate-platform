import type { CountryDefinition } from "@/config/countries";
import { getCountryBySlug, type CountryCodeLower } from "@/config/countries";

export type SupportedCurrencyCode = "CAD" | "USD" | "SYP";

const LOCALE_BY_CURRENCY: Record<SupportedCurrencyCode, string> = {
  CAD: "en-CA",
  USD: "en-US",
  SYP: "ar-SY",
};

/**
 * Formats an amount in major units (e.g. dollars, pounds) for the country's default currency.
 */
export function formatMoneyMajorUnits(
  amount: number,
  currency: SupportedCurrencyCode,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const locale = LOCALE_BY_CURRENCY[currency] ?? "en-CA";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount);
}

export function currencyForCountrySlug(slug: CountryCodeLower): SupportedCurrencyCode {
  return getCountryBySlug(slug)?.currency ?? "CAD";
}

export function formatForCountry(
  amount: number,
  countrySlug: CountryCodeLower,
  country?: CountryDefinition
): string {
  const c = country ?? getCountryBySlug(countrySlug);
  const cur = (c?.currency ?? "CAD") as SupportedCurrencyCode;
  return formatMoneyMajorUnits(amount, cur);
}
