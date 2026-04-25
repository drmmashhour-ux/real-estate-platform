/**
 * BNHub dynamic pricing — input signals (transparent, host-visible).
 * All factors are surfaced in API/UI reasoning; nothing is hidden.
 */

export type PricingAiDemandLevel = "low" | "medium" | "high";

/** Minimal listing slice passed into `suggestDynamicPrice`. */
export type PricingAiListingInput = {
  id: string;
  nightPriceCents: number;
  city: string;
  beds?: number | null;
  propertyType?: string | null;
  /** Host-controlled mode; suggest endpoint never overrides without explicit apply. */
  pricingMode?: string | null;
};

/**
 * Normalized signal bundle for one suggestion pass.
 * - `basePriceCents` should match the listing’s current nightly base (host can override later).
 * - Rates like `occupancyRate01` are 0–1 when known; null means unknown (caller explains in reasoning).
 */
export type PricingAiSignalBundle = {
  basePriceCents: number;
  /** 0 = weak market interest, 1 = strong (from funnel + smart demand). */
  locationDemand01: number;
  /** Multiplier vs neutral (1.0 = no seasonal tilt). */
  seasonalityFactor: number;
  /** City-wide peer median (published listings, same city). */
  nearbyListingMedianCents: number | null;
  nearbyListingSampleSize: number;
  /** Peers with similar bed count (±1), same city, when sample exists. */
  similarPropertyMedianCents: number | null;
  similarPropertySampleSize: number;
  /** Occupied-night share over recent window (e.g. 30d), or null if not computable. */
  occupancyRate01: number | null;
  /** Days from “pricing date” to guest check-in; null if not tied to a stay date. */
  bookingLeadTimeDays: number | null;
  /** Optional local event / convention demand 0–1. */
  eventDemand01: number;
  listingViews30d: number;
  bookingStarts30d: number;
  viewToStartRate: number;
  demandLevelLabel: PricingAiDemandLevel;
};

export type PricingAiSuggestMode = "manual" | "assist" | "auto";
