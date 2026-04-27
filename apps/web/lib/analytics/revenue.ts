export type RevenueTrackPayload = {
  listingId: string;
  price: number;
  conversionRate: number;
};

/**
 * Hook for Datadog / warehouse — console in dev; extend with server event or product analytics.
 */
export function trackRevenueEvent(data: RevenueTrackPayload): void {
  console.log("[REVENUE]", data);
}
