/**
 * Marginal revenue proxy: nightly price × conversion (bookings / views).
 * Not including length-of-stay — use as a relative score for price selection.
 */
export function estimateRevenue(price: number, conversionRate: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(conversionRate)) {
    return 0;
  }
  return Math.max(0, price) * Math.max(0, Math.min(1, conversionRate));
}
