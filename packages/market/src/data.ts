/**
 * Market data access layer — manual/admin CSV today; structure supports future API feeds.
 */

import type { MarketDataPoint as MarketDataPointRow } from "@prisma/client";
import { prisma } from "@/lib/db";

export type NormalizedMarketPoint = {
  id: string;
  city: string;
  postalCode: string | null;
  propertyType: string;
  date: Date;
  avgPriceCents: number;
  medianPriceCents: number | null;
  avgRentCents: number | null;
  transactions: number | null;
  inventory: number | null;
};

/** Fetch ordered history for trend / forecast engines. */
export async function getMarketHistory(
  city: string,
  propertyType: string
): Promise<MarketDataPointRow[]> {
  const c = city.trim();
  const t = propertyType.trim();
  if (!c || !t) return [];

  return prisma.marketDataPoint.findMany({
    where: {
      city: { equals: c, mode: "insensitive" },
      propertyType: { equals: t, mode: "insensitive" },
    },
    orderBy: { date: "asc" },
  });
}

/** Recent rows for a city (all property types), for dashboards / discovery. */
export async function getRecentMarketData(city: string, monthsBack = 24): Promise<MarketDataPointRow[]> {
  const c = city.trim();
  if (!c) return [];
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  return prisma.marketDataPoint.findMany({
    where: {
      city: { equals: c, mode: "insensitive" },
      date: { gte: since },
    },
    orderBy: [{ date: "asc" }, { propertyType: "asc" }],
  });
}

/**
 * Sort, dedupe same calendar month (keeps latest), drop invalid rows.
 * Ready for CSV/API rows that may be unsorted or duplicated.
 */
export function normalizeMarketData(rows: MarketDataPointRow[]): NormalizedMarketPoint[] {
  const sorted = [...rows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const byMonth = new Map<string, MarketDataPointRow>();

  for (const r of sorted) {
    if (r.avgPriceCents <= 0) continue;
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
    const prev = byMonth.get(key);
    if (!prev || r.date.getTime() >= prev.date.getTime()) {
      byMonth.set(key, r);
    }
  }

  return [...byMonth.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((r) => ({
      id: r.id,
      city: r.city,
      postalCode: r.postalCode,
      propertyType: r.propertyType,
      date: r.date,
      avgPriceCents: r.avgPriceCents,
      medianPriceCents: r.medianPriceCents,
      avgRentCents: r.avgRentCents,
      transactions: r.transactions,
      inventory: r.inventory,
    }));
}

export async function listDistinctCitiesWithData(): Promise<string[]> {
  const rows = await prisma.marketDataPoint.groupBy({
    by: ["city"],
    _count: true,
  });
  return rows.map((r) => r.city).sort((a, b) => a.localeCompare(b));
}

export type CityMetricSummary = {
  city: string;
  propertyType: string;
  priceGrowth6mPercent: number | null;
  rentYieldProxy: number | null;
  trendLabel: "rising" | "stable" | "declining";
};

/**
 * Aggregate leaderboard metrics for investor dashboard (best growth, yield proxy, trending).
 */
export async function getCitySummariesForLeaderboard(): Promise<CityMetricSummary[]> {
  const { analyzeMarketTrend } = await import("@/lib/ai/market-trends");
  const grouped = await prisma.marketDataPoint.groupBy({
    by: ["city", "propertyType"],
    _count: true,
  });
  const out: CityMetricSummary[] = [];

  for (const g of grouped) {
    const raw = await getMarketHistory(g.city, g.propertyType);
    const norm = normalizeMarketData(raw);
    if (norm.length < 2) continue;
    const trend = analyzeMarketTrend(norm);
    const last = norm[norm.length - 1]!;
    const price = last.avgPriceCents;
    const rent = last.avgRentCents;
    const rentYieldProxy =
      price > 0 && rent != null && rent > 0 ? ((rent * 12) / price) * 100 : null;

    out.push({
      city: g.city,
      propertyType: g.propertyType,
      priceGrowth6mPercent: trend.priceGrowth6mPercent,
      rentYieldProxy,
      trendLabel: trend.trend,
    });
  }

  return out;
}
