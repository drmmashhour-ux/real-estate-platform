import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getListingRevenueMetrics } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { addUtcDays, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import { percentChange, round2, safeDivide } from "@/modules/investment/recommendation-math";

/**
 * Loads BNHub listing metrics from `BnhubRevenueMetricSnapshot` when present, else live booking aggregates
 * for the same trailing 30 UTC day window as the dashboard. Trends require ≥2 snapshots.
 */
export async function loadListingRecommendationMetrics(listingId: string) {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      listingStatus: true,
      investmentPurchasePriceMajor: true,
      investmentEstimatedValueMajor: true,
      investmentOperatingCostMonthlyMajor: true,
      investmentAnalyticsActive: true,
    },
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  const today = startOfUtcDay(new Date());
  const windowStart = addUtcDays(today, -29);

  const snapshots = await prisma.bnhubRevenueMetricSnapshot.findMany({
    where: {
      scopeType: "listing",
      scopeId: listingId,
    },
    orderBy: { snapshotDate: "desc" },
    take: 2,
  });

  const live = await getListingRevenueMetrics(listingId, {
    start: windowStart,
    end: today,
  });
  if (!live) {
    throw new Error("Listing not found or BNHub metrics unavailable.");
  }

  const latestSnap = snapshots[0] ?? null;
  const previousSnap = snapshots[1] ?? null;

  const base = latestSnap ?? live;

  const grossRevenue = Number(base.grossRevenue ?? 0);
  const occupancyRate = Number(base.occupancyRate ?? 0);
  const adr = Number(base.adr ?? 0);
  const revpar = Number(base.revpar ?? 0);
  const bookingCount = Number(base.bookingCount ?? 0);

  const monthlyCost = Number(listing.investmentOperatingCostMonthlyMajor ?? 0);
  /** Same simplification as task sketch: treat trailing-window revenue ×12 as “annualized” exposure for ratio math — not a forecast. */
  const annualRevenueSimple = grossRevenue * 12;
  const annualCost = monthlyCost * 12;

  const purchasePrice = listing.investmentPurchasePriceMajor ?? null;

  const roiAnnualized =
    purchasePrice !== null && purchasePrice > 0 ? round2(safeDivide(annualRevenueSimple - annualCost, purchasePrice)) : null;

  /** Monthly revenue approximation for coverage: trailing-window gross / ~1 month slice of window length (30d). */
  const approxMonthlyRevenueFromWindow = grossRevenue;
  const costCoverageRatio =
    monthlyCost > 0 ? round2(safeDivide(approxMonthlyRevenueFromWindow, monthlyCost)) : null;

  let revenueTrend: number | null = null;
  let occupancyTrend: number | null = null;

  if (latestSnap && previousSnap) {
    revenueTrend = round2(percentChange(Number(latestSnap.grossRevenue), Number(previousSnap.grossRevenue)));
    occupancyTrend = round2(
      percentChange(Number(latestSnap.occupancyRate ?? 0), Number(previousSnap.occupancyRate ?? 0))
    );
  }

  const dataParts = [
    latestSnap ? "Latest row from BNHub revenue metric snapshots (same 30-day definitions as dashboard)." : null,
    live ? "Trailing 30 UTC day KPIs recomputed live from Booking rows." : null,
    !latestSnap ? "No stored snapshots yet — exclusively live window metrics." : null,
  ].filter(Boolean);

  return {
    listing,
    metrics: {
      listingId: listing.id,
      listingTitle: listing.title,
      dataNote: dataParts.join(" "),
      grossRevenue,
      occupancyRate,
      adr,
      revpar,
      bookingCount,
      roiAnnualized,
      costCoverageRatio,
      revenueTrend,
      occupancyTrend,
      purchasePriceRecorded: purchasePrice !== null && purchasePrice > 0,
      estimatedValueRecorded: listing.investmentEstimatedValueMajor != null,
      operatingCostRecorded: monthlyCost > 0,
    },
  };
}

export type LoadedListingRecommendationMetrics = Awaited<ReturnType<typeof loadListingRecommendationMetrics>>["metrics"];

/** Published + analytics-enabled stays only (batch jobs). */
export async function findBnhubListingIdsForRecommendationBatch() {
  const rows = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      investmentAnalyticsActive: true,
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
