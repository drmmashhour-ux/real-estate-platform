/**
 * Market reports – aggregate report per region/period.
 */

import { prisma } from "@/lib/db";
import { getPriceIndex } from "./price-index";
import { getRentIndex } from "./rent-index";
import { getBnhubIndex } from "./bnhub-index";
import { getDemandMetrics } from "./demand";

export async function generateReportForRegion(marketRegionId: string, reportPeriod: string) {
  const [region, priceRows, rentRows, bnhubRows, demandRows] = await Promise.all([
    prisma.marketRegion.findUnique({ where: { id: marketRegionId } }),
    getPriceIndex(marketRegionId, { limit: 12 }),
    getRentIndex(marketRegionId, { limit: 12 }),
    getBnhubIndex(marketRegionId, { limit: 12 }),
    getDemandMetrics(marketRegionId, { limit: 12 }),
  ]);
  if (!region) return null;

  const latestPrice = priceRows[0];
  const latestRent = rentRows[0];
  const latestBnhub = bnhubRows[0];
  const latestDemand = demandRows[0];

  const reportSummary = [
    latestPrice && `Sale price index: avg ${formatCents(latestPrice.averagePrice)}, trend ${latestPrice.trendDirection ?? "n/a"}.`,
    latestRent && `Rent index: avg ${formatCents(latestRent.averageRent)}/mo, trend ${latestRent.trendDirection ?? "n/a"}.`,
    latestBnhub && `BNHub: nightly ${formatCents(latestBnhub.averageNightlyRate)}, occupancy ${(latestBnhub.averageOccupancy ?? 0) * 100}%, revenue ${formatCents(latestBnhub.averageMonthlyRevenue)}/mo.`,
    latestDemand && `Demand: score ${latestDemand.demandScore ?? "n/a"}, bookings ${latestDemand.bookingVolume ?? 0}, inventory ${latestDemand.inventoryLevel ?? 0}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const reportData = {
    priceTrends: priceRows.map((r) => ({ period: r.period, averagePrice: r.averagePrice, trendDirection: r.trendDirection })),
    rentTrends: rentRows.map((r) => ({ period: r.period, averageRent: r.averageRent, trendDirection: r.trendDirection })),
    bnhubTrends: bnhubRows.map((r) => ({
      period: r.period,
      averageNightlyRate: r.averageNightlyRate,
      averageOccupancy: r.averageOccupancy,
      averageMonthlyRevenue: r.averageMonthlyRevenue,
      averageRating: r.averageRating,
    })),
    demandTrends: demandRows.map((r) => ({
      period: r.period,
      demandScore: r.demandScore,
      bookingVolume: r.bookingVolume,
      inventoryLevel: r.inventoryLevel,
    })),
  };

  return prisma.marketReport.upsert({
    where: { marketRegionId_reportPeriod: { marketRegionId, reportPeriod } },
    create: {
      marketRegionId,
      reportPeriod,
      reportSummary,
      reportData,
    },
    update: { reportSummary, reportData },
  });
}

function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "n/a";
  return `$${(cents / 100).toLocaleString()}`;
}

export async function getReport(marketRegionId: string, reportPeriod?: string) {
  if (reportPeriod) {
    return prisma.marketReport.findUnique({
      where: { marketRegionId_reportPeriod: { marketRegionId, reportPeriod } },
    });
  }
  return prisma.marketReport.findFirst({
    where: { marketRegionId },
    orderBy: { reportPeriod: "desc" },
  });
}

export async function listReports(marketRegionId: string, limit = 12) {
  return prisma.marketReport.findMany({
    where: { marketRegionId },
    orderBy: { reportPeriod: "desc" },
    take: limit,
  });
}
