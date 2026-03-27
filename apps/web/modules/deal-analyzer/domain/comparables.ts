export const PricePositioningOutcome = {
  BELOW_COMPARABLE_RANGE: "below_comparable_range",
  WITHIN_COMPARABLE_RANGE: "within_comparable_range",
  ABOVE_COMPARABLE_RANGE: "above_comparable_range",
  INSUFFICIENT_COMPARABLE_DATA: "insufficient_comparable_data",
} as const;
export type PricePositioningOutcome =
  (typeof PricePositioningOutcome)[keyof typeof PricePositioningOutcome];

export const ComparableSourceType = {
  FSBO: "fsbo",
} as const;

export type ComparableCandidate = {
  id: string;
  priceCents: number;
  pricePerSqft: number | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  listingStatus: string;
  latitude: number | null;
  longitude: number | null;
};

export type ComparableWithScore = ComparableCandidate & {
  similarityScore: number;
  distanceKm: number | null;
};

export type ComparablePositioningResult = {
  outcome: PricePositioningOutcome;
  confidenceLevel: "low" | "medium" | "high";
  subjectPriceCents: number;
  comparableCount: number;
  /** Min / max of comparable prices (cents) when sufficient data. */
  priceRangeCents: { low: number; high: number } | null;
  medianPriceCents: number | null;
  reasons: string[];
  warnings: string[];
};
