/**
 * Long-term: monthly lease rent.
 * Short-term (Airbnb-style): nightly rate × occupancy × 30 nights (illustrative month).
 */

export const RENTAL_TYPE = {
  LONG_TERM: "LONG_TERM",
  SHORT_TERM: "SHORT_TERM",
} as const;

export type RentalType = (typeof RENTAL_TYPE)[keyof typeof RENTAL_TYPE];

/** monthlyRevenue = nightlyRate × (occupancyPercent / 100) × 30 */
export function computeShortTermMonthlyRevenue(nightlyRate: number, occupancyPercent: number): number {
  return nightlyRate * (occupancyPercent / 100) * 30;
}

export function computeAnnualRevenueFromMonthly(monthlyRevenue: number): number {
  return monthlyRevenue * 12;
}

/** Revenue if occupancy drops by `deltaPercent` points (e.g. 10). */
export function occupancySensitivityDelta(
  nightlyRate: number,
  occupancyPercent: number,
  deltaPercent: number
): { before: number; after: number; deltaMonthly: number } {
  const before = computeShortTermMonthlyRevenue(nightlyRate, occupancyPercent);
  const after = computeShortTermMonthlyRevenue(
    nightlyRate,
    Math.max(0, Math.min(100, occupancyPercent - deltaPercent))
  );
  return { before, after, deltaMonthly: before - after };
}

export function rentalTypeLabel(t: string | null | undefined): "Long-term" | "Short-term" {
  return t === RENTAL_TYPE.SHORT_TERM ? "Short-term" : "Long-term";
}
