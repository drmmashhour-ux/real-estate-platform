import { prisma } from "@/lib/db";

type CountryRow = {
  countryCode: string;
  displayName: string;
  defaultCurrency: string;
  defaultLocale: string;
  regionPricingMultiplier: number;
  seoActivated: boolean;
  active: boolean;
};

export type CountryConfig = {
  countryCode: string;
  displayName: string;
  defaultCurrency: string;
  defaultLocale: string;
  regionPricingMultiplier: number;
  seoActivated: boolean;
  active: boolean;
};

/** Built-in defaults when DB row is missing (bootstrap / tests). */
export const BUILTIN_COUNTRY_DEFAULTS: Record<
  string,
  Omit<CountryConfig, "countryCode" | "seoActivated" | "active">
> = {
  CA: { displayName: "Canada", defaultCurrency: "cad", defaultLocale: "en-CA", regionPricingMultiplier: 1 },
  US: { displayName: "United States", defaultCurrency: "usd", defaultLocale: "en-US", regionPricingMultiplier: 1 },
  FR: { displayName: "France", defaultCurrency: "eur", defaultLocale: "fr-FR", regionPricingMultiplier: 1.02 },
  GB: { displayName: "United Kingdom", defaultCurrency: "gbp", defaultLocale: "en-GB", regionPricingMultiplier: 1.05 },
};

function rowToConfig(row: CountryRow): CountryConfig {
  return {
    countryCode: row.countryCode,
    displayName: row.displayName,
    defaultCurrency: row.defaultCurrency,
    defaultLocale: row.defaultLocale,
    regionPricingMultiplier: row.regionPricingMultiplier,
    seoActivated: row.seoActivated,
    active: row.active,
  };
}

export async function getCountryConfig(countryCode: string): Promise<CountryConfig | null> {
  const code = countryCode.trim().toUpperCase();
  const store = (prisma as unknown as { globalCountryConfig?: { findUnique: (a: object) => Promise<CountryRow | null> } })
    .globalCountryConfig;
  const row = store ? await store.findUnique({ where: { countryCode: code } }) : null;
  if (!row) {
    const b = BUILTIN_COUNTRY_DEFAULTS[code];
    if (!b) return null;
    return { countryCode: code, ...b, seoActivated: false, active: true };
  }
  return rowToConfig(row);
}

export async function listActiveCountries(): Promise<CountryConfig[]> {
  const store = (prisma as unknown as { globalCountryConfig?: { findMany: (a: object) => Promise<CountryRow[]> } })
    .globalCountryConfig;
  if (!store) {
    return Object.entries(BUILTIN_COUNTRY_DEFAULTS).map(([countryCode, b]) => ({
      countryCode,
      ...b,
      seoActivated: false,
      active: true,
    }));
  }
  const rows = await store.findMany({
    where: { active: true },
    orderBy: { countryCode: "asc" },
  });
  return rows.map(rowToConfig);
}
