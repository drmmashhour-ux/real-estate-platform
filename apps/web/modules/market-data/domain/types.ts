/** Normalized market payloads — scoring must not import provider SDKs directly. */

export type MarketDataSource = "reso" | "attom" | "rentcast" | "internal";

export type PropertyDetailsNormalized = {
  source: MarketDataSource;
  confidence: number;
  fetchedAt: string;
  parcelId?: string;
  livingAreaSqft?: number | null;
  yearBuilt?: number | null;
};

export type ComparablePropertyNormalized = {
  id: string;
  priceCents: number | null;
  distanceKm?: number | null;
  similarityScore?: number | null;
};

export type RentEstimateNormalized = {
  monthlyRentLow?: number | null;
  monthlyRentHigh?: number | null;
  confidence: number;
  source: MarketDataSource;
};

export type NeighborhoodSignalsNormalized = {
  trendLabel?: string;
  inventoryHint?: string;
  confidence: number;
};
