import { detectCityListingGaps, detectHighViewsLowBookings, type CityTrafficSignal, type GrowthOpportunity, type ListingFunnelSignal } from "./opportunity-detector";

export type GrowthEngineInput = {
  cities?: CityTrafficSignal[];
  listings?: ListingFunnelSignal[];
};

/**
 * Single entry to collect growth opportunities for cron / admin digest.
 */
export function runGrowthOpportunityScan(input: GrowthEngineInput): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  if (input.cities?.length) {
    out.push(...detectCityListingGaps(input.cities));
  }
  if (input.listings?.length) {
    out.push(...detectHighViewsLowBookings(input.listings));
  }
  return out;
}
