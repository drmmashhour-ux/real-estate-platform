import type { BNHubListingConversionMetrics, BNHubSearchConversionMetrics } from "../guest-conversion/guest-conversion.types";
import type { BNHubConversionMetrics } from "./bnhub-guest-conversion.types";

/** Builds V1 funnel metrics from raw counts (e.g. admin rollups). */
export function bnhubConversionMetricsFromRawCounts(raw: {
  impressions: number;
  clicks: number;
  views: number;
  bookingStarts: number;
  bookingsCompleted: number;
}): BNHubConversionMetrics {
  const { impressions, clicks, views, bookingStarts, bookingsCompleted } = raw;
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const viewRate = clicks > 0 ? views / clicks : 0;
  const bookingRate = views > 0 ? bookingsCompleted / views : 0;
  const viewToStartRate = views > 0 ? bookingStarts / views : 0;
  const startToPaidRate = bookingStarts > 0 ? bookingsCompleted / bookingStarts : 0;
  return {
    impressions,
    clicks,
    views,
    bookingStarts,
    bookingsCompleted,
    ctr,
    viewRate,
    bookingRate,
    viewToStartRate,
    startToPaidRate,
  };
}

/**
 * Merges read-only search + listing funnel metrics into a single BNHub V1 metrics object.
 * Does not mutate inputs.
 */
export function computeBnhubConversionMetrics(
  search: BNHubSearchConversionMetrics,
  listing: BNHubListingConversionMetrics,
): BNHubConversionMetrics {
  const impressions = search.impressions ?? 0;
  const clicks = search.clicks ?? 0;
  const views = listing.listingViews ?? 0;
  const bookingStarts = listing.bookingStarts ?? 0;
  const bookingsCompleted = listing.bookingCompletions ?? 0;

  const ctr = impressions > 0 ? clicks / impressions : 0;
  const viewRate = clicks > 0 ? views / clicks : 0;
  const bookingRate = views > 0 ? bookingsCompleted / views : 0;
  const viewToStartRate = views > 0 ? bookingStarts / views : 0;
  const startToPaidRate = bookingStarts > 0 ? bookingsCompleted / bookingStarts : 0;

  return {
    impressions,
    clicks,
    views,
    bookingStarts,
    bookingsCompleted,
    ctr,
    viewRate,
    bookingRate,
    viewToStartRate,
    startToPaidRate,
  };
}
