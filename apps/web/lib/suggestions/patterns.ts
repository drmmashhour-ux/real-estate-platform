import { prisma } from "@/lib/db";

export type DetectedPattern = {
  type: string;
  priority: "low" | "medium" | "high";
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  rationale: Record<string, unknown>;
};

export async function detectSuggestionPatterns(ownerType: string, ownerId: string): Promise<DetectedPattern[]> {
  const recentSignals = await prisma.lecipmUserBehaviorSignal.findMany({
    where: { ownerType, ownerId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const patterns: DetectedPattern[] = [];

  const repeatSearches = recentSignals.filter((s) => s.signalType === "repeat_search");
  if (repeatSearches.length >= 3) {
    patterns.push({
      type: "saved_search_opportunity",
      priority: "medium",
      title: "Save this recurring search",
      message:
        "You have repeated similar searches several times. Save it and get alerts when new inventory matches.",
      rationale: {
        repeatSearchCount: repeatSearches.length,
      },
    });
  }

  const dealViews = recentSignals.filter((s) => s.signalType === "deal_view");
  const topDealViews = new Map<string, number>();
  for (const s of dealViews) {
    if (!s.referenceId) continue;
    topDealViews.set(s.referenceId, (topDealViews.get(s.referenceId) ?? 0) + 1);
  }

  for (const [dealId, count] of topDealViews.entries()) {
    if (count >= 3) {
      patterns.push({
        type: "watchlist_opportunity",
        priority: "medium",
        title: "Track this deal more closely",
        message: "You viewed this deal multiple times. Add it to a watchlist or run a structured comparison workflow.",
        relatedEntityType: "deal",
        relatedEntityId: dealId,
        rationale: { repeatedViews: count },
      });
    }
  }

  const appraisalSignals = recentSignals.filter((s) => s.signalType === "appraisal_open");
  if (appraisalSignals.length >= 2) {
    patterns.push({
      type: "appraisal_workflow",
      priority: "high",
      title: "Consider a structured valuation review",
      message:
        "You opened valuation or appraisal surfaces multiple times. A proposed workflow can organize assumptions and comparables — still requires your approval.",
      rationale: { appraisalPageViews: appraisalSignals.length },
    });
  }

  const portfolioViews = recentSignals.filter((s) => s.signalType === "portfolio_view");
  if (portfolioViews.length >= 3) {
    patterns.push({
      type: "portfolio_optimization",
      priority: "medium",
      title: "Review portfolio concentration and next steps",
      message:
        "You revisited portfolio views frequently. Compare holdings and rebalance opportunities in an advisory workflow.",
      rationale: { portfolioViews: portfolioViews.length },
    });
  }

  const neighborhoodHits = recentSignals.filter((s) => s.signalType === "neighborhood_focus");
  if (neighborhoodHits.length >= 4) {
    patterns.push({
      type: "neighborhood_intel",
      priority: "medium",
      title: "Deep-dive this neighborhood",
      message: "Repeated focus on the same area — pull market snapshots and saved searches together in one workflow.",
      relatedEntityType: neighborhoodHits[0]?.referenceType ?? "neighborhood",
      relatedEntityId: neighborhoodHits[0]?.referenceId ?? undefined,
      rationale: { neighborhoodSignalCount: neighborhoodHits.length },
    });
  }

  const listingViews = recentSignals.filter((s) => s.signalType === "listing_view");
  const topListing = new Map<string, number>();
  for (const s of listingViews) {
    if (!s.referenceId) continue;
    topListing.set(s.referenceId, (topListing.get(s.referenceId) ?? 0) + 1);
  }
  for (const [listingId, count] of topListing.entries()) {
    if (count >= 4) {
      patterns.push({
        type: "listing_deep_dive",
        priority: "low",
        title: "Listing getting sustained attention",
        message: "You returned to this listing often — optional analysis or watchlist workflow.",
        relatedEntityType: "listing",
        relatedEntityId: listingId,
        rationale: { listingViews: count },
      });
    }
  }

  return patterns;
}
