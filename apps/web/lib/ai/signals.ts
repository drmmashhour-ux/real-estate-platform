import type { PricingStatsRow } from "@/lib/services/pricingEngine";

export type ListingSignals = {
  occupancyRate: number;
  recentBookings: number;
  views: number;
};

/**
 * Generic inputs for the pricing/ranking path (views may come from event_logs or be 0 in SQL-only flows).
 */
export function computeSignals(data: {
  bookedNights: number;
  bookings30d: number;
  views?: number;
}): ListingSignals {
  const nights = Math.max(0, Number.isFinite(data.bookedNights) ? data.bookedNights : 0);
  return {
    occupancyRate: Math.min(1, Math.max(0, nights / 90)),
    recentBookings: Math.max(0, Number.isFinite(data.bookings30d) ? data.bookings30d : 0),
    views: data.views && Number.isFinite(data.views) ? Math.max(0, data.views) : 0,
  };
}

/** Map a row from `getPricingData` + optional view count into {@link computeSignals} inputs. */
export function buildSignalsFromPricingRow(
  row: PricingStatsRow | undefined,
  views = 0
): ListingSignals {
  if (!row) {
    return { occupancyRate: 0, recentBookings: 0, views: views || 0 };
  }
  return computeSignals({
    bookedNights: row.booked_nights_90d != null ? Number(row.booked_nights_90d) : 0,
    bookings30d: row.demand_bookings_30d != null ? Number(row.demand_bookings_30d) : 0,
    views,
  });
}
