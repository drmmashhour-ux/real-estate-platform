/**
 * Funnel labels for conversion analytics (pair with `growth_funnel_events`).
 */
export const FUNNEL_STAGES = [
  "visit",
  "listing_view",
  "contact_host",
  "booking_request",
  "checkout",
  "payment_success",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export function conversionRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10_000) / 10_000;
}
