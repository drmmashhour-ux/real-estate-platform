/**
 * Sale price index – from transactions and valuations by region/period.
 */

import { prisma } from "@/lib/db";
import type { TrendDirection } from "./types";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function computeTrend(current: number, previous: number | null): TrendDirection | null {
  if (previous == null || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (pct > 2) return "up";
  if (pct < -2) return "down";
  return "stable";
}

export async function computePriceIndexForRegion(
  marketRegionId: string,
  period: string
): Promise<{ averagePrice: number | null; medianPrice: number | null; trendDirection: TrendDirection | null; sampleSize: number }> {
  const propertyIds = await prisma.propertyIdentity.findMany({
    where: { marketRegionId },
    select: { id: true },
  }).then((r) => r.map((p) => p.id));
  if (propertyIds.length === 0) {
    return { averagePrice: null, medianPrice: null, trendDirection: null, sampleSize: 0 };
  }

  const [year, month] = period.split("-").map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  const completed = await prisma.realEstateTransaction.findMany({
    where: {
      propertyIdentityId: { in: propertyIds },
      status: "completed",
      updatedAt: { gte: periodStart, lte: periodEnd },
      offerPrice: { not: null },
    },
    select: { offerPrice: true },
  });
  const pricesFromTx = completed.map((t) => t.offerPrice!).filter((p) => p > 0);

  const valuations = await prisma.propertyValuation.findMany({
    where: {
      propertyIdentityId: { in: propertyIds },
      valuationType: "sale",
      estimatedValue: { not: null },
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    select: { estimatedValue: true },
  });
  const pricesFromVal = valuations.map((v) => v.estimatedValue!).filter((p) => p > 0);

  const allPrices = [...pricesFromTx, ...pricesFromVal];
  const sampleSize = allPrices.length;
  const averagePrice = sampleSize > 0 ? Math.round(allPrices.reduce((a, b) => a + b, 0) / sampleSize) : null;
  const medianPrice = sampleSize > 0 ? Math.round(median(allPrices)!) : null;

  const prevMonth = month === 1 ? [year - 1, 12] : [year, month - 1];
  const prevPeriod = `${prevMonth[0]}-${String(prevMonth[1]).padStart(2, "0")}`;
  const prevRow = await prisma.marketPriceIndex.findUnique({
    where: { marketRegionId_period: { marketRegionId, period: prevPeriod } },
  });
  const previousAvg = prevRow?.averagePrice ?? null;
  const trendDirection = averagePrice != null && previousAvg != null ? computeTrend(averagePrice, previousAvg) : null;

  return { averagePrice, medianPrice, trendDirection, sampleSize };
}

export async function upsertPriceIndex(
  marketRegionId: string,
  period: string,
  data: {
    averagePrice?: number | null;
    medianPrice?: number | null;
    pricePerUnit?: number | null;
    trendDirection?: string | null;
    sampleSize?: number | null;
  }
) {
  return prisma.marketPriceIndex.upsert({
    where: { marketRegionId_period: { marketRegionId, period } },
    create: {
      marketRegionId,
      period,
      averagePrice: data.averagePrice ?? undefined,
      medianPrice: data.medianPrice ?? undefined,
      pricePerUnit: data.pricePerUnit ?? undefined,
      trendDirection: data.trendDirection ?? undefined,
      sampleSize: data.sampleSize ?? undefined,
    },
    update: {
      averagePrice: data.averagePrice ?? undefined,
      medianPrice: data.medianPrice ?? undefined,
      pricePerUnit: data.pricePerUnit ?? undefined,
      trendDirection: data.trendDirection ?? undefined,
      sampleSize: data.sampleSize ?? undefined,
    },
  });
}

export async function getPriceIndex(marketRegionId: string, options?: { limit?: number }) {
  return prisma.marketPriceIndex.findMany({
    where: { marketRegionId },
    orderBy: { period: "desc" },
    take: options?.limit ?? 24,
  });
}
