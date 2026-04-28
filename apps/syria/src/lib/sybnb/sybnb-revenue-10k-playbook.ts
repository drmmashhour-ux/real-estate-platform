/**
 * ORDER SYBNB-73 — ~$10K/month revenue mix plan for Hadiah Link ops (targets & formulas).
 * Numbers are planning anchors — settle actual ASP with Ops before promising partners.
 */

export const SYBNB73_MONTHLY_TARGET_USD = 10_000;

export type Sybnb73RevenueLineId = "hotels" | "featuredListings" | "premiumListings" | "agentBookings";

export interface Sybnb73RevenueLine {
  readonly id: Sybnb73RevenueLineId;
  /** Conservative monthly USD for this row (agent row uses floor; upside fills toward target). */
  readonly monthlyUsd: number;
}

/** Hotels — primary revenue driver: active paid hotel partnerships × average monthly subscription. */
export const SYBNB73_HOTELS_COUNT = 120;
export const SYBNB73_HOTEL_AVG_MONTHLY_USD = 50;

/** Featured listings — paid boosts sold per day × price × days in month. */
export const SYBNB73_FEATURED_PER_DAY = 15;
export const SYBNB73_FEATURED_PRICE_USD = 3;
export const SYBNB73_DAYS_PER_MONTH = 30;

/** Premium listings — monthly premium slots × price. */
export const SYBNB73_PREMIUM_SLOTS_PER_MONTH = 30;
export const SYBNB73_PREMIUM_PRICE_USD = 10;

/** Agent-driven bookings — platform commissions + manual upsells (floor; stretch hits ~$10k total). */
export const SYBNB73_AGENT_BOOKINGS_FLOOR_USD = 2_000;

export const SYBNB73_REVENUE_LINES: readonly Sybnb73RevenueLine[] = [
  { id: "hotels", monthlyUsd: SYBNB73_HOTELS_COUNT * SYBNB73_HOTEL_AVG_MONTHLY_USD },
  {
    id: "featuredListings",
    monthlyUsd: SYBNB73_FEATURED_PER_DAY * SYBNB73_FEATURED_PRICE_USD * SYBNB73_DAYS_PER_MONTH,
  },
  {
    id: "premiumListings",
    monthlyUsd: SYBNB73_PREMIUM_SLOTS_PER_MONTH * SYBNB73_PREMIUM_PRICE_USD,
  },
  { id: "agentBookings", monthlyUsd: SYBNB73_AGENT_BOOKINGS_FLOOR_USD },
];

export function sybnb73ComputedFloorMonthlyUsd(): number {
  return SYBNB73_REVENUE_LINES.reduce((sum, row) => sum + row.monthlyUsd, 0);
}
