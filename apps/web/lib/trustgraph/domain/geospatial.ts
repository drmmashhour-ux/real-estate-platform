export type GeocodePrecision = "rooftop" | "range" | "area" | "unknown";

export type NormalizedGeocodeSummary = {
  provider: string;
  version: string;
  precision: GeocodePrecision;
  confidence: number;
  matchedCity: string | null;
  matchedRegion: string | null;
};
