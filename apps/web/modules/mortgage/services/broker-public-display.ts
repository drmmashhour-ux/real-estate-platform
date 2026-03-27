/** Minimum average rating to show “Top Broker” badge (requires at least one review). */
export const TOP_BROKER_MIN_RATING = 4.5;

export function formatBrokerResponseTimeLabel(hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours) || hours < 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  const d = hours / 24;
  return `${d.toFixed(1)} days`;
}

export function isTopBrokerDisplay(rating: number, totalReviews: number): boolean {
  return totalReviews >= 1 && rating >= TOP_BROKER_MIN_RATING;
}
