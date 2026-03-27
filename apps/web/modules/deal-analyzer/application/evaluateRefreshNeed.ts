import { prisma } from "@/lib/db";
import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import {
  hoursBetween,
  needsRefreshDueToStaleness,
  priceChangeExceedsThreshold,
} from "@/modules/deal-analyzer/infrastructure/services/staleAnalysisService";

export async function evaluateRefreshNeed(listingId: string, opts?: { force?: boolean }) {
  const listing = await prisma.fsboListing.findUnique({ where: { id: listingId } });
  const analysis = await prisma.dealAnalysis.findFirst({
    where: { propertyId: listingId },
    orderBy: { createdAt: "desc" },
  });
  if (!listing || !analysis) {
    return { shouldRefresh: false as const, reasons: ["No listing or analysis on file."] };
  }

  const summary =
    analysis.summary && typeof analysis.summary === "object" ? (analysis.summary as Record<string, unknown>) : {};
  const phase4 =
    typeof summary.phase4 === "object" && summary.phase4 != null ? (summary.phase4 as Record<string, unknown>) : {};
  const lastRefreshRaw = phase4.lastComparableRefreshAt;
  const lastRefresh = typeof lastRefreshRaw === "string" ? new Date(lastRefreshRaw) : null;
  const lastPrice =
    typeof phase4.lastKnownPriceCents === "number" ? phase4.lastKnownPriceCents : null;

  const reasons: string[] = [];

  if (opts?.force) {
    reasons.push("manual or forced refresh");
    return { shouldRefresh: true as const, reasons };
  }

  if (
    needsRefreshDueToStaleness({
      listingUpdatedAt: listing.updatedAt,
      analysisUpdatedAt: analysis.updatedAt,
      lastComparableRefreshAt: lastRefresh,
    })
  ) {
    reasons.push("Comparable window may be stale relative to listing updates or age.");
  }

  if (priceChangeExceedsThreshold(lastPrice, listing.priceCents, dealAnalyzerConfig.phase4.refresh.priceChangeTriggerPct)) {
    reasons.push("List price changed since last recorded comparable snapshot.");
  }

  if (reasons.length === 0) {
    return { shouldRefresh: false as const, reasons: ["No refresh triggers at this time."] };
  }

  const minH = dealAnalyzerConfig.phase4.refresh.minHoursBetweenAutoRefresh;
  if (lastRefresh && hoursBetween(new Date(), lastRefresh) < minH) {
    return {
      shouldRefresh: false as const,
      reasons: [`Minimum interval between refreshes (${minH}h) not reached.`],
    };
  }

  return { shouldRefresh: true as const, reasons };
}
