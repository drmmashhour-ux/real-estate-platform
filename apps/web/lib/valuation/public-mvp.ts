/**
 * Public seller lead valuation (AI marketing funnel).
 * Spec: sqft × average $/sqft per market band; min/max from band low/high × sqft.
 * Replaceable later with comps / ML.
 *
 * (Project has `lib/valuation/*` for internal AVM; this module is the public `/evaluate` engine.)
 */

export const VALUATION_ENGINE_VERSION = "mvp-rules-v2" as const;
export type ValuationEngineId = "mvp-rules" | "openai" | "ml";

export type PublicValuationInput = {
  address: string;
  city: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  surfaceSqft: number;
  condition?: string;
};

export type PublicValuationResult = {
  /** Primary headline number (sqft × mid $/sqft) */
  estimatedValue: number;
  rangeMin: number;
  rangeMax: number;
  /** Aliases for API consumers */
  estimate: number;
  minValue: number;
  maxValue: number;
  pricePerSqftMid: number;
  pricePerSqftLow: number;
  pricePerSqftHigh: number;
  cityKey: "montreal" | "laval" | "quebec" | "other";
  engine: ValuationEngineId;
  engineVersion: typeof VALUATION_ENGINE_VERSION;
  factors: Record<string, unknown>;
};

const CITY_PPSF = {
  montreal: { low: 400, high: 600 },
  laval: { low: 300, high: 500 },
  quebec: { low: 250, high: 450 },
  /** Fallback if a free-text city slips through */
  other: { low: 250, high: 450 },
} as const;

function normalizeCityKey(city: string): PublicValuationResult["cityKey"] {
  const t = city.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (t.includes("montreal") || t.includes("mont-real")) return "montreal";
  if (t.includes("laval")) return "laval";
  if (
    t.includes("quebec city") ||
    t === "quebec" ||
    t.includes("quebec") ||
    t.includes("ville de quebec") ||
    t.includes("levis")
  ) {
    return "quebec";
  }
  return "other";
}

/**
 * MVP estimate: band midpoint × living area; range from band edges × sqft only.
 * Not a professional appraisal.
 */
export function estimatePublicPropertyValue(input: PublicValuationInput): PublicValuationResult {
  const cityKey = normalizeCityKey(input.city);
  const band = CITY_PPSF[cityKey];

  const sqftRaw = Number(input.surfaceSqft);
  const sqft = Number.isFinite(sqftRaw) ? Math.min(20000, Math.max(250, sqftRaw)) : 1000;

  const avgPpsf = (band.low + band.high) / 2;
  const estimatedValue = Math.round(sqft * avgPpsf);
  const rangeMin = Math.round(sqft * band.low);
  const rangeMax = Math.round(sqft * band.high);

  const factors = {
    cityKey,
    sqft,
    beds: Number.isFinite(input.bedrooms) ? input.bedrooms : null,
    baths: Number.isFinite(input.bathrooms) ? input.bathrooms : null,
    propertyType: input.propertyType,
    condition: input.condition ?? null,
    band,
    formula: "sqft × avgPpsf; min = sqft×low; max = sqft×high",
  };

  return {
    estimatedValue,
    rangeMin,
    rangeMax,
    estimate: estimatedValue,
    minValue: rangeMin,
    maxValue: rangeMax,
    pricePerSqftMid: Math.round(avgPpsf),
    pricePerSqftLow: band.low,
    pricePerSqftHigh: band.high,
    cityKey,
    engine: "mvp-rules",
    engineVersion: VALUATION_ENGINE_VERSION,
    factors,
  };
}

export async function estimatePublicPropertyValueAsync(
  input: PublicValuationInput,
  _options?: { engine?: ValuationEngineId }
): Promise<PublicValuationResult> {
  return estimatePublicPropertyValue(input);
}
