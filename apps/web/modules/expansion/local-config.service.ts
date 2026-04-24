/**
 * Local market configuration — taxes, fees, rules, and readiness flags from DB + JSON overlays.
 */
import { prisma } from "@/lib/db";
import type { RegionalConfigV1 } from "./local-config.types";

function safeParseRegionalJson(raw: unknown): RegionalConfigV1 {
  if (raw == null || typeof raw !== "object") return {};
  return raw as RegionalConfigV1;
}

function parseEnvOverlay(): Record<string, Partial<RegionalConfigV1>> {
  const raw = process.env.EXPANSION_REGIONAL_OVERRIDES_JSON?.trim();
  if (!raw) return {};
  try {
    const j = JSON.parse(raw) as Record<string, Partial<RegionalConfigV1>>;
    return typeof j === "object" && j != null ? j : {};
  } catch {
    return {};
  }
}

function mergeConfig(base: RegionalConfigV1, overlay: Partial<RegionalConfigV1> | undefined): RegionalConfigV1 {
  if (!overlay) return { ...base };
  return {
    ...base,
    ...overlay,
    taxes: overlay.taxes ?? base.taxes,
    fees: overlay.fees ?? base.fees,
    rules: overlay.rules ?? base.rules,
    enabledFeatures: overlay.enabledFeatures ?? base.enabledFeatures,
    enabledCitySlugs: overlay.enabledCitySlugs ?? base.enabledCitySlugs,
    complianceHints: { ...base.complianceHints, ...overlay.complianceHints },
  };
}

export type ExpansionCountryWithConfig = {
  id: string;
  code: string;
  name: string;
  currency: string;
  isActive: boolean;
  defaultLocale: string;
  supportedLocales: string[];
  regionalConfigJson: unknown;
};

export async function getExpansionCountryByCode(code: string): Promise<ExpansionCountryWithConfig | null> {
  const c = code.trim();
  if (!c) return null;
  return prisma.expansionCountry.findFirst({
    where: { code: { equals: c, mode: "insensitive" } },
    select: {
      id: true,
      code: true,
      name: true,
      currency: true,
      isActive: true,
      defaultLocale: true,
      supportedLocales: true,
      regionalConfigJson: true,
    },
  });
}

export async function getRegionalConfigForCountryCode(countryCode: string): Promise<{
  country: ExpansionCountryWithConfig | null;
  config: RegionalConfigV1;
}> {
  const country = await getExpansionCountryByCode(countryCode);
  const base = safeParseRegionalJson(country?.regionalConfigJson);
  const overlays = parseEnvOverlay();
  const overlay = overlays[countryCode.toUpperCase()] ?? overlays[countryCode] ?? undefined;
  return { country, config: mergeConfig(base, overlay) };
}

export function getEnabledFeatures(config: RegionalConfigV1): string[] {
  return config.enabledFeatures?.length ? [...config.enabledFeatures] : [];
}

export function getEnabledCitySlugs(config: RegionalConfigV1): string[] {
  return config.enabledCitySlugs?.length ? [...config.enabledCitySlugs] : [];
}

export type MarketReadiness = {
  enabledFeatures: string[];
  enabledCitySlugs: string[];
  countryActive: boolean;
};

export async function getMarketReadinessForCountry(countryCode: string): Promise<MarketReadiness | null> {
  const { country, config } = await getRegionalConfigForCountryCode(countryCode);
  if (!country) return null;
  return {
    enabledFeatures: getEnabledFeatures(config),
    enabledCitySlugs: getEnabledCitySlugs(config),
    countryActive: country.isActive,
  };
}
