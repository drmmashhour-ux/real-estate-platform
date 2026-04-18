import { prisma } from "@/lib/db";
import { bnhubConversionLayerFlags, readPublicBnhubConversionV1 } from "@/config/feature-flags";
import { buildListingConversionMetrics } from "../guest-conversion/listing-conversion.service";
import { buildSearchConversionMetrics } from "../guest-conversion/search-conversion.service";
import type { BNHubListingConversionSummaryV1 } from "./bnhub-guest-conversion.types";
import { computeBnhubConversionMetrics } from "./bnhub-guest-conversion-metrics";
import { analyzeBNHubConversion } from "./bnhub-guest-conversion-analyzer.service";
import { detectBNHubFriction } from "./bnhub-friction-detector.service";
import { buildTopBnhubConversionRecommendations } from "./bnhub-conversion-recommendations";
import {
  buildBnhubAlerts,
  buildBnhubQuickWins,
  computeWeakestStep,
  pickBiggestIssue,
} from "./bnhub-conversion-funnel-diagnostics";

/**
 * Listing-level funnel summary — read-only DB aggregates + deterministic insights (advisory).
 */
export async function buildListingConversionSummary(
  listingId: string,
  windowDays?: number,
): Promise<BNHubListingConversionSummaryV1> {
  const ctx = windowDays != null ? { windowDays } : undefined;
  const [searchRes, listingRes, hintsRow] = await Promise.all([
    buildSearchConversionMetrics(listingId, ctx),
    buildListingConversionMetrics(listingId, windowDays),
    prisma.shortTermListing
      .findUnique({
        where: { id: listingId },
        select: {
          photos: true,
          description: true,
          descriptionFr: true,
          nightPriceCents: true,
        },
      })
      .catch(() => null),
  ]);

  const hints =
    hintsRow != null
      ? {
          photoCount: Array.isArray(hintsRow.photos) ? hintsRow.photos.length : 0,
          descriptionLen: [hintsRow.description, hintsRow.descriptionFr].filter(Boolean).join(" ").trim().length,
          nightPriceCents: hintsRow.nightPriceCents,
        }
      : null;

  const metrics = computeBnhubConversionMetrics(searchRes.metrics, listingRes.metrics);
  const insights = [...analyzeBNHubConversion(metrics), ...detectBNHubFriction(metrics)];
  const recommendations = buildTopBnhubConversionRecommendations(insights);
  const weakest = computeWeakestStep(metrics);
  const biggestIssue = pickBiggestIssue(metrics, insights);
  const quickWins = buildBnhubQuickWins(metrics, insights, hints);
  const alerts = buildBnhubAlerts(metrics, insights);

  return {
    listingId,
    metrics,
    insights,
    recommendations,
    weakestStep: weakest.step,
    weakestStepLabel: weakest.label,
    biggestIssue,
    quickWins,
    alerts,
    trackingParity: {
      serverUi: bnhubConversionLayerFlags.conversionV1,
      clientBeacon: readPublicBnhubConversionV1(),
      aligned: bnhubConversionLayerFlags.conversionV1 && readPublicBnhubConversionV1(),
    },
    createdAt: new Date().toISOString(),
  };
}
