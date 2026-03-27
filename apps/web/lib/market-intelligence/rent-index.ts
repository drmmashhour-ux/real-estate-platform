/**
 * Long-term rental index – from valuations (long_term_rental) by region/period.
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

export async function computeRentIndexForRegion(
  marketRegionId: string,
  period: string
): Promise<{ averageRent: number | null; medianRent: number | null; trendDirection: TrendDirection | null; sampleSize: number }> {
  const propertyIds = await prisma.propertyIdentity.findMany({
    where: { marketRegionId },
    select: { id: true },
  }).then((r) => r.map((p) => p.id));
  if (propertyIds.length === 0) {
    return { averageRent: null, medianRent: null, trendDirection: null, sampleSize: 0 };
  }

  const [year, month] = period.split("-").map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  const valuations = await prisma.propertyValuation.findMany({
    where: {
      propertyIdentityId: { in: propertyIds },
      valuationType: "long_term_rental",
      monthlyRentEstimate: { not: null },
      createdAt: { gte: periodStart, lte: periodEnd },
    },
    select: { monthlyRentEstimate: true },
  });
  const rents = valuations.map((v) => v.monthlyRentEstimate!).filter((p) => p > 0);
  const sampleSize = rents.length;
  const averageRent = sampleSize > 0 ? Math.round(rents.reduce((a, b) => a + b, 0) / sampleSize) : null;
  const medianRent = sampleSize > 0 ? Math.round(median(rents)!) : null;

  const prevMonth = month === 1 ? [year - 1, 12] : [year, month - 1];
  const prevPeriod = `${prevMonth[0]}-${String(prevMonth[1]).padStart(2, "0")}`;
  const prevRow = await prisma.marketRentIndex.findUnique({
    where: { marketRegionId_period: { marketRegionId, period: prevPeriod } },
  });
  const previousAvg = prevRow?.averageRent ?? null;
  const trendDirection = averageRent != null && previousAvg != null ? computeTrend(averageRent, previousAvg) : null;

  return { averageRent, medianRent, trendDirection, sampleSize };
}

export async function upsertRentIndex(
  marketRegionId: string,
  period: string,
  data: {
    averageRent?: number | null;
    medianRent?: number | null;
    rentPerUnit?: number | null;
    trendDirection?: string | null;
    sampleSize?: number | null;
  }
) {
  return prisma.marketRentIndex.upsert({
    where: { marketRegionId_period: { marketRegionId, period } },
    create: {
      marketRegionId,
      period,
      averageRent: data.averageRent ?? undefined,
      medianRent: data.medianRent ?? undefined,
      rentPerUnit: data.rentPerUnit ?? undefined,
      trendDirection: data.trendDirection ?? undefined,
      sampleSize: data.sampleSize ?? undefined,
    },
    update: {
      averageRent: data.averageRent ?? undefined,
      medianRent: data.medianRent ?? undefined,
      rentPerUnit: data.rentPerUnit ?? undefined,
      trendDirection: data.trendDirection ?? undefined,
      sampleSize: data.sampleSize ?? undefined,
    },
  });
}

export async function getRentIndex(marketRegionId: string, options?: { limit?: number }) {
  return prisma.marketRentIndex.findMany({
    where: { marketRegionId },
    orderBy: { period: "desc" },
    take: options?.limit ?? 24,
  });
}
