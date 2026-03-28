import { getCountryConfig } from "@/src/modules/global/countries";

/**
 * Apply regional multiplier to a base nightly price in cents (advisory / display).
 */
export async function applyRegionMultiplier(baseCents: number, countryCode: string): Promise<number> {
  const cfg = await getCountryConfig(countryCode);
  const m = cfg?.regionPricingMultiplier ?? 1;
  return Math.round(baseCents * m);
}
