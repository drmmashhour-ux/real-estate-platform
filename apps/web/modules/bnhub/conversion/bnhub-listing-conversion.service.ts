import { buildListingConversionMetrics } from "../guest-conversion/listing-conversion.service";
import { buildSearchConversionMetrics } from "../guest-conversion/search-conversion.service";
import type { BNHubListingConversionSummaryV1 } from "./bnhub-guest-conversion.types";
import { computeBnhubConversionMetrics } from "./bnhub-guest-conversion-metrics";
import { analyzeBNHubConversion } from "./bnhub-guest-conversion-analyzer.service";
import { detectBNHubFriction } from "./bnhub-friction-detector.service";
import { buildTopBnhubConversionRecommendations } from "./bnhub-conversion-recommendations";

/**
 * Listing-level funnel summary — read-only DB aggregates + deterministic insights (advisory).
 */
export async function buildListingConversionSummary(
  listingId: string,
  windowDays?: number,
): Promise<BNHubListingConversionSummaryV1> {
  const ctx = windowDays != null ? { windowDays } : undefined;
  const [searchRes, listingRes] = await Promise.all([
    buildSearchConversionMetrics(listingId, ctx),
    buildListingConversionMetrics(listingId, windowDays),
  ]);

  const metrics = computeBnhubConversionMetrics(searchRes.metrics, listingRes.metrics);
  const insights = [...analyzeBNHubConversion(metrics), ...detectBNHubFriction(metrics)];
  const recommendations = buildTopBnhubConversionRecommendations(insights);

  return {
    listingId,
    metrics,
    insights,
    recommendations,
    createdAt: new Date().toISOString(),
  };
}
