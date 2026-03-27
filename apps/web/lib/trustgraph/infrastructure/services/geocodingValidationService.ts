import type { NormalizedGeocodeSummary } from "@/lib/trustgraph/domain/geospatial";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";

export type GeocodingProvider = {
  name: string;
  version: string;
  normalizeFromListing(input: {
    address: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
  }): NormalizedGeocodeSummary;
};

/**
 * Deterministic stub provider — swap for Mapbox/Google adapter without changing rules.
 */
export const stubGeocodingProvider: GeocodingProvider = {
  name: "stub-deterministic",
  version: "1",
  normalizeFromListing(input) {
    const hasCoords =
      input.latitude != null &&
      input.longitude != null &&
      Number.isFinite(input.latitude) &&
      Number.isFinite(input.longitude);
    const precision = hasCoords ? ("rooftop" as const) : ("unknown" as const);
    const confidence = hasCoords ? 0.85 : 0.35;
    return {
      provider: stubGeocodingProvider.name,
      version: stubGeocodingProvider.version,
      precision,
      confidence,
      matchedCity: input.city?.trim() || null,
      matchedRegion: null,
    };
  },
};

export function geocodePrecisionScore(summary: NormalizedGeocodeSummary): number {
  const cfg = getPhase6MoatConfig().geospatial;
  switch (summary.precision) {
    case "rooftop":
      return 0.9;
    case "range":
      return 0.65;
    case "area":
      return Math.max(cfg.weakPrecisionWarningBelow, 0.45);
    default:
      return 0.3;
  }
}
