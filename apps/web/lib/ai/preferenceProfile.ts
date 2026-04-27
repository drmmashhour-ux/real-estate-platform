import type { UserPrefRow } from "@/lib/ai/preferences";

const ALLOW = new Set(["city", "propertyType", "priceRange", "searchQuery"] as const);

export type PreferenceKey = (typeof ALLOW extends Set<infer V> ? V : never) | string;

export const PREFERENCE_KEY_ALLOWLIST = ["city", "propertyType", "priceRange", "searchQuery"] as const;

/**
 * `weight * exp(-lambda * ageInDays)` — recent interactions matter more if batch decay lags.
 */
export function effectivePreferenceWeight(weight: number, updatedAt: Date, lambda: number = 0.07): number {
  const w = Number.isFinite(weight) && weight > 0 ? weight : 0;
  const ageMs = Date.now() - updatedAt.getTime();
  const ageDays = Math.max(0, ageMs / 86_400_000);
  return w * Math.exp(-lambda * ageDays);
}

export type BuiltPreferenceProfile = {
  topCities: string[];
  topPropertyTypes: string[];
  topQueries: string[];
  priceBand: "low" | "mid" | "high" | null;
  /** Allowlisted row count; used for low-signal gating. */
  prefCount: number;
};

type EffRow = UserPrefRow & { eff: number };

function toEff(p: UserPrefRow): EffRow {
  const u = p.updatedAt instanceof Date ? p.updatedAt : new Date();
  return { ...p, eff: effectivePreferenceWeight(p.weight, u) };
}

function takeTopValues(rows: EffRow[], n: number): string[] {
  return [...rows].sort((a, b) => b.eff - a.eff).slice(0, n).map((r) => r.value);
}

/**
 * Pre-aggregates user_preferences into compact top-N slices for fast ranking.
 */
export function buildUserProfile(preferences: UserPrefRow[], topN: number = 3): BuiltPreferenceProfile {
  const allowed: EffRow[] = preferences
    .filter((p) => ALLOW.has(p.key as (typeof PREFERENCE_KEY_ALLOWLIST)[number]))
    .map(toEff);
  if (allowed.length === 0) {
    return { topCities: [], topPropertyTypes: [], topQueries: [], priceBand: null, prefCount: 0 };
  }
  const byCity = allowed.filter((r) => r.key === "city");
  const byProp = allowed.filter((r) => r.key === "propertyType");
  const byQ = allowed.filter((r) => r.key === "searchQuery");
  const byPrice = allowed.filter((r) => r.key === "priceRange");
  const topPrice = byPrice.length ? [...byPrice].sort((a, b) => b.eff - a.eff)[0] : null;
  const band =
    topPrice && (topPrice.value === "low" || topPrice.value === "mid" || topPrice.value === "high")
      ? topPrice.value
      : null;
  return {
    topCities: takeTopValues(byCity, topN),
    topPropertyTypes: takeTopValues(byProp, topN),
    topQueries: takeTopValues(byQ, topN),
    priceBand: band,
    prefCount: allowed.length,
  };
}

export function isAllowedPreferenceKey(key: string): boolean {
  return ALLOW.has(key as "city" | "propertyType" | "priceRange" | "searchQuery");
}
