/**
 * Multi-country platform configuration: languages, currency, payments, and feature gates per market.
 * URL segment is lowercase ISO 3166-1 alpha-2 (`ca`, `sy`).
 */

export type CountryCodeLower = "ca" | "sy";

export type PaymentProviderKind = "stripe" | "manual";

export type CountryFeatures = {
  BNHub: boolean;
  BuySell: boolean;
  mortgageHub: boolean;
  insuranceHub: boolean;
};

export type CountryDefinition = {
  /** ISO 3166-1 alpha-2 uppercase — keys of `countries` */
  code: Uppercase<CountryCodeLower>;
  /** Display name */
  name: string;
  /** URL segment (lowercase) */
  slug: CountryCodeLower;
  languages: readonly string[];
  defaultLanguage: string;
  currency: "CAD" | "USD" | "SYP";
  paymentProvider: PaymentProviderKind;
  features: CountryFeatures;
  /** Emoji flag for selectors */
  flag: string;
};

export const countries = {
  CA: {
    code: "CA",
    name: "Canada",
    slug: "ca",
    languages: ["en", "fr"],
    defaultLanguage: "en",
    currency: "CAD",
    paymentProvider: "stripe",
    features: {
      BNHub: true,
      BuySell: true,
      mortgageHub: true,
      insuranceHub: true,
    },
    flag: "🇨🇦",
  },
  SY: {
    code: "SY",
    name: "Syria",
    slug: "sy",
    languages: ["ar"],
    defaultLanguage: "ar",
    currency: "SYP",
    paymentProvider: "manual",
    features: {
      BNHub: true,
      BuySell: true,
      mortgageHub: false,
      insuranceHub: false,
    },
    flag: "🇸🇾",
  },
} as const satisfies Record<string, CountryDefinition>;

export const COUNTRY_SLUGS: readonly CountryCodeLower[] = [countries.CA.slug, countries.SY.slug];

export const DEFAULT_COUNTRY_SLUG: CountryCodeLower = countries.CA.slug;

/** Active countries surfaced in routing (Syria can stay off until launch). */
export const ROUTED_COUNTRY_SLUGS: readonly CountryCodeLower[] =
  process.env.NEXT_PUBLIC_ENABLE_SYRIA === "1" ? COUNTRY_SLUGS : [countries.CA.slug];

export function isCountrySlug(value: string | undefined | null): value is CountryCodeLower {
  if (!value) return false;
  const v = value.toLowerCase() as CountryCodeLower;
  return (COUNTRY_SLUGS as readonly string[]).includes(v);
}

export function getCountryBySlug(slug: string): CountryDefinition | undefined {
  const k = slug.toLowerCase() as CountryCodeLower;
  const entry = Object.values(countries).find((c) => c.slug === k);
  return entry;
}

export function isLocaleAllowedForCountry(
  locale: string,
  country: CountryDefinition
): boolean {
  return country.languages.includes(locale);
}

export function defaultLocaleForCountrySlug(slug: CountryCodeLower): string {
  const c = getCountryBySlug(slug);
  return c?.defaultLanguage ?? "en";
}
