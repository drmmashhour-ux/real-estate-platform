/**
 * Automated growth **signals** — enqueue campaigns / notifications in product code; this file stays pure.
 */

export type CityTrafficSignal = {
  cityKey: string;
  sessionsEstimate: number;
  listingCount: number;
};

export type ListingFunnelSignal = {
  listingId: string;
  views: number;
  bookings: number;
};

export type GrowthOpportunity =
  | { kind: "city_supply_gap"; cityKey: string; message: string }
  | { kind: "listing_conversion_gap"; listingId: string; message: string };

export function detectCityListingGaps(cities: CityTrafficSignal[]): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  for (const c of cities) {
    if (c.sessionsEstimate >= 200 && c.listingCount < 5) {
      out.push({
        kind: "city_supply_gap",
        cityKey: c.cityKey,
        message: `Add listings in ${c.cityKey}: traffic present but inventory thin.`,
      });
    }
  }
  return out;
}

export function detectHighViewsLowBookings(rows: ListingFunnelSignal[]): GrowthOpportunity[] {
  const out: GrowthOpportunity[] = [];
  for (const r of rows) {
    if (r.views >= 80 && r.bookings === 0) {
      out.push({
        kind: "listing_conversion_gap",
        listingId: r.listingId,
        message: "High views but no bookings — improve photos, pricing, or instant book.",
      });
    }
  }
  return out;
}
