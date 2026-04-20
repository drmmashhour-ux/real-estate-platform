import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addUtcDays, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import { getListingRevenueMetrics } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import type { ListingAllocationMetrics } from "./capital-allocator.types";

/**
 * Loads BNHub listing KPIs from **real** booking-derived metrics + internal recommendation/outcome rows.
 * Uses `ShortTermListing` (BNHub) + `getListingRevenueMetrics` — not the SaaS `RevenueSnapshot` table.
 * Does not fabricate market comparables or external benchmarks.
 */
export async function loadAllocationMetricsForPortfolio(scopeId: string): Promise<ListingAllocationMetrics[]> {
  const listings = await prisma.shortTermListing.findMany({
    where: {
      ownerId: scopeId,
      listingStatus: ListingStatus.PUBLISHED,
    },
    select: {
      id: true,
      title: true,
      improvementBudgetNeed: true,
      marketingBudgetNeed: true,
      operationalRiskScore: true,
      manualCapitalLock: true,
      investmentOperatingCostMonthlyMajor: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const today = startOfUtcDay(new Date());
  const start = addUtcDays(today, -29);
  const range = { start, end: today };

  const rows: ListingAllocationMetrics[] = [];

  for (const listing of listings) {
    const live = await getListingRevenueMetrics(listing.id, range);

    const recommendation = await prisma.investmentRecommendation.findFirst({
      where: {
        scopeType: "listing",
        scopeId: listing.id,
        status: "active",
      },
      orderBy: { updatedAt: "desc" },
    });

    const latestOutcome = await prisma.autonomyOutcome.findFirst({
      where: {
        action: {
          scopeType: "listing",
          scopeId: listing.id,
        },
      },
      orderBy: { evaluatedAt: "desc" },
    });

    const pricingRule = await prisma.autonomyRuleWeight.findFirst({
      where: {
        scopeType: "listing",
        scopeId: listing.id,
        domain: "pricing",
      },
      orderBy: { updatedAt: "desc" },
    });

    const grossRevenue = live?.grossRevenue ?? 0;
    const occupancyRate = live?.occupancyRate ?? 0;
    const adr = live?.adr ?? 0;
    const revpar = live?.revpar ?? 0;
    const bookingCount = live?.bookingCount ?? 0;

    rows.push({
      listingId: listing.id,
      listingTitle: live?.listingTitle ?? listing.title,
      grossRevenue: Number(grossRevenue || 0),
      occupancyRate: Number(occupancyRate || 0),
      adr: Number(adr || 0),
      revpar: Number(revpar || 0),
      bookingCount: Number(bookingCount || 0),
      recommendation: recommendation?.recommendation ?? null,
      recommendationScore: recommendation != null ? Number(recommendation.score ?? 0) : null,
      recommendationConfidence: recommendation != null ? Number(recommendation.confidenceScore ?? 0) : null,
      upliftScore:
        latestOutcome != null
          ? Number(latestOutcome.upliftAdjustedReward ?? latestOutcome.rewardScore ?? 0)
          : null,
      pricingActionSuccess: pricingRule != null ? Number(pricingRule.averageReward ?? 0) : null,
      operatingCostMonthly: listing.investmentOperatingCostMonthlyMajor != null
        ? Number(listing.investmentOperatingCostMonthlyMajor)
        : null,
      improvementBudgetNeed: listing.improvementBudgetNeed != null ? Number(listing.improvementBudgetNeed) : null,
      marketingBudgetNeed: listing.marketingBudgetNeed != null ? Number(listing.marketingBudgetNeed) : null,
      operationalRiskScore: listing.operationalRiskScore != null ? Number(listing.operationalRiskScore) : null,
      manualCapitalLock: listing.manualCapitalLock === true,
    });
  }

  return rows;
}

/**
 * v1: `portfolio` and `investor` both resolve listings where `ShortTermListing.ownerId === scopeId` (BNHub host user).
 * LP-only or cross-user investor portfolios need an explicit listing crosswalk later — never invent metrics.
 */
export async function loadAllocationMetricsForScope(
  scopeType: string,
  scopeId: string,
): Promise<ListingAllocationMetrics[]> {
  const t = scopeType.toLowerCase();
  if (t === "portfolio" || t === "investor") {
    return loadAllocationMetricsForPortfolio(scopeId);
  }
  throw new Error(`Unsupported capital allocator scopeType: ${scopeType}`);
}
