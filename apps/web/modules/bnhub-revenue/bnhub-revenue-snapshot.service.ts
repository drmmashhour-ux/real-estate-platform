/**
 * Persists deterministic KPI snapshots for listing + portfolio scopes (BNHub revenue dashboard).
 */

import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { startOfUtcDay } from "./bnhub-revenue-math";
import { getListingRevenueMetrics, getPortfolioRevenueMetrics } from "./bnhub-revenue-dashboard.service";

export async function createRevenueSnapshotsForHost(hostUserId: string): Promise<void> {
  const today = startOfUtcDay(new Date());
  const startRange = new Date(today);
  startRange.setUTCDate(startRange.getUTCDate() - 29);

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostUserId, listingStatus: ListingStatus.PUBLISHED },
    select: { id: true },
  });

  const range = { start: startRange, end: today };

  for (const listing of listings) {
    const metrics = await getListingRevenueMetrics(listing.id, range);
    if (!metrics) continue;

    await prisma.bnhubRevenueMetricSnapshot.upsert({
      where: {
        scopeType_scopeId_snapshotDate: {
          scopeType: "listing",
          scopeId: listing.id,
          snapshotDate: today,
        },
      },
      create: {
        scopeType: "listing",
        scopeId: listing.id,
        snapshotDate: today,
        grossRevenue: metrics.grossRevenue,
        bookingCount: metrics.bookingCount,
        occupiedNights: metrics.occupiedNights,
        availableNights: metrics.availableNights,
        occupancyRate: metrics.occupancyRate,
        adr: metrics.adr,
        revpar: metrics.revpar,
      },
      update: {
        grossRevenue: metrics.grossRevenue,
        bookingCount: metrics.bookingCount,
        occupiedNights: metrics.occupiedNights,
        availableNights: metrics.availableNights,
        occupancyRate: metrics.occupancyRate,
        adr: metrics.adr,
        revpar: metrics.revpar,
      },
    });
  }

  const portfolio = await getPortfolioRevenueMetrics(hostUserId, range);

  await prisma.bnhubRevenueMetricSnapshot.upsert({
    where: {
      scopeType_scopeId_snapshotDate: {
        scopeType: "portfolio",
        scopeId: hostUserId,
        snapshotDate: today,
      },
    },
    create: {
      scopeType: "portfolio",
      scopeId: hostUserId,
      snapshotDate: today,
      grossRevenue: portfolio.grossRevenue,
      bookingCount: portfolio.bookingCount,
      occupiedNights: portfolio.occupiedNights,
      availableNights: portfolio.availableNights,
      occupancyRate: portfolio.occupancyRate,
      adr: portfolio.adr,
      revpar: portfolio.revpar,
    },
    update: {
      grossRevenue: portfolio.grossRevenue,
      bookingCount: portfolio.bookingCount,
      occupiedNights: portfolio.occupiedNights,
      availableNights: portfolio.availableNights,
      occupancyRate: portfolio.occupancyRate,
      adr: portfolio.adr,
      revpar: portfolio.revpar,
    },
  });

  await prisma.bnhubDashboardEventLog.create({
    data: {
      type: "metric_refresh",
      scopeType: "portfolio",
      scopeId: hostUserId,
      status: "success",
      message: "BNHub revenue snapshots refreshed",
    },
  });
}
