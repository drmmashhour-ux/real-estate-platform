export type ListingSignals = {
  occupancyRate: number;
  bookings30d: number;
  views: number;
};

/**
 * Rule-based health flags (cheap to run in cron; replace with time-series baselines when ready).
 */
export function detectAnomalies(s: ListingSignals): string[] {
  const flags: string[] = [];
  if (s.occupancyRate < 0.2) flags.push("low_occupancy");
  if (s.bookings30d === 0 && s.views > 50) flags.push("no_conversion");
  if (s.views > 200 && s.bookings30d < 2) flags.push("high_dropoff");
  return flags;
}
