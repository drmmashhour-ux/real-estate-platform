import type { BehaviorPreferenceProfile } from "@prisma/client";
import { MAX_CONTEXT_MATCH_BOOST } from "@/lib/learning/behavior-weights";
import type { ContextPreferenceVector, ListingLearningFeatures } from "@/lib/learning/types";

function jsonToWeightedMap(raw: unknown): Map<string, number> {
  const m = new Map<string, number>();
  if (!Array.isArray(raw)) return m;
  for (const row of raw) {
    if (row && typeof row === "object" && "key" in row && "w" in row) {
      const k = String((row as { key: string }).key).toLowerCase().trim();
      const w = Number((row as { w: number }).w);
      if (k && Number.isFinite(w)) m.set(k, Math.min(5, Math.max(0, w)));
    } else if (typeof row === "string") {
      const k = row.toLowerCase().trim();
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
  }
  return m;
}

/** Build a sparse preference vector from stored JSON rows (incremental updates from aggregation). */
export function preferenceVectorFromProfile(profile: BehaviorPreferenceProfile | null): ContextPreferenceVector {
  if (!profile) {
    return {
      cities: new Map(),
      propertyTypes: new Map(),
      priceBands: new Map(),
      beds: new Map(),
      amenities: new Map(),
      categories: new Map(),
    };
  }
  return {
    cities: jsonToWeightedMap(profile.preferredCitiesJson),
    propertyTypes: jsonToWeightedMap(profile.preferredPropertyTypesJson),
    priceBands: jsonToWeightedMap(profile.preferredPriceBandsJson),
    beds: jsonToWeightedMap(profile.preferredBedsJson),
    amenities: jsonToWeightedMap(profile.preferredAmenitiesJson),
    categories: jsonToWeightedMap(profile.preferredCategoriesJson),
  };
}

/**
 * Bounded 0–1 match between listing features and learned preferences (no hard filtering).
 */
export function computeListingContextMatch(
  features: ListingLearningFeatures,
  prefs: ContextPreferenceVector,
  searchCity?: string | null
): number {
  let score = 0;
  let parts = 0;

  const city = features.city.toLowerCase();
  const cityW = prefs.cities.get(city) ?? 0;
  if (prefs.cities.size > 0) {
    parts += 1;
    score += Math.min(1, cityW / 3);
  } else if (searchCity?.trim()) {
    const q = searchCity.trim().toLowerCase();
    parts += 1;
    if (city.includes(q) || q.includes(city)) score += 0.85;
    else score += 0.35;
  }

  const pt = (features.propertyType ?? "").toLowerCase();
  if (pt && prefs.propertyTypes.size > 0) {
    parts += 1;
    score += Math.min(1, (prefs.propertyTypes.get(pt) ?? 0) / 3);
  }

  if (prefs.priceBands.size > 0) {
    parts += 1;
    score += Math.min(1, (prefs.priceBands.get(features.priceBucket) ?? 0) / 3);
  }

  const bedKey = String(features.bedrooms ?? features.beds);
  if (prefs.beds.size > 0) {
    parts += 1;
    score += Math.min(1, (prefs.beds.get(bedKey) ?? 0) / 3);
  }

  if (prefs.amenities.size > 0) {
    let am = 0;
    let n = 0;
    if (features.hasParking) {
      n += 1;
      am += prefs.amenities.get("parking") ?? 0;
    }
    if (features.petFriendly) {
      n += 1;
      am += prefs.amenities.get("pets") ?? 0;
    }
    if (n > 0) {
      parts += 1;
      score += Math.min(1, am / (3 * n));
    }
  }

  if (parts === 0) return 0.5;
  const raw = score / parts;
  return Math.min(1, Math.max(0, raw));
}

/** Scale context match into a small boost capped by MAX_CONTEXT_MATCH_BOOST. */
export function contextMatchBoost01(match: number): number {
  const centered = match - 0.5;
  return Math.max(-MAX_CONTEXT_MATCH_BOOST, Math.min(MAX_CONTEXT_MATCH_BOOST, centered * 2 * MAX_CONTEXT_MATCH_BOOST));
}
