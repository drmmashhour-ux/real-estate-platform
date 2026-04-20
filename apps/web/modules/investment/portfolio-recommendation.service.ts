import { prisma } from "@/lib/db";

function summarizeRows(rows: { scopeId: string; recommendation: string; score: unknown; confidenceScore: unknown }[]) {
  const seen = new Set<string>();
  const latestPerListing = rows.filter((r) => {
    if (seen.has(r.scopeId)) return false;
    seen.add(r.scopeId);
    return true;
  });

  const counts = {
    buy: 0,
    sell: 0,
    optimize: 0,
    hold: 0,
    watch: 0,
  };

  for (const row of latestPerListing) {
    const k = row.recommendation as keyof typeof counts;
    if (k in counts) counts[k] += 1;
  }

  return {
    total: latestPerListing.length,
    counts,
    strongestBuys: latestPerListing
      .filter((r) => r.recommendation === "buy")
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 5),
    highestRiskSells: latestPerListing
      .filter((r) => r.recommendation === "sell")
      .sort((a, b) => Number(a.score) - Number(b.score))
      .slice(0, 5),
  };
}

/**
 * Portfolio summary limited to BNHub listings visible to an investor scope (host user id).
 */
export async function getPortfolioRecommendationSummaryForListingIds(listingIds: string[]) {
  if (listingIds.length === 0) {
    return {
      total: 0,
      counts: { buy: 0, sell: 0, optimize: 0, hold: 0, watch: 0 },
      strongestBuys: [] as InvestmentRecommendation[],
      highestRiskSells: [] as InvestmentRecommendation[],
    };
  }

  const rows = await prisma.investmentRecommendation.findMany({
    where: {
      scopeType: "listing",
      scopeId: { in: listingIds },
      status: "active",
    },
    orderBy: { createdAt: "desc" },
    take: 800,
  });

  return summarizeRows(rows);
}

/**
 * Aggregates **latest active** recommendation per BNHub listing to avoid double-counting historical runs.
 */
export async function getPortfolioRecommendationSummary() {
  const rows = await prisma.investmentRecommendation.findMany({
    where: {
      scopeType: "listing",
      status: "active",
    },
    orderBy: { createdAt: "desc" },
    take: 800,
  });

  return summarizeRows(rows);
}
