import "server-only";

import { prisma } from "@/lib/db";

export type MarketSeriesRow = {
  date: string;
  avgPriceCents: number;
  avgRentCents: number | null;
};

export type MarketCityAnalysis = {
  label: string;
  trend: {
    trend: "up" | "down" | "flat";
    priceGrowth3mPercent: number | null;
    priceGrowth6mPercent: number | null;
    priceGrowth12mPercent: number | null;
    rentGrowth6mPercent: number | null;
  };
  marketScore: number;
  confidence: number;
  forecast: {
    predictedPrice3Months: number;
    predictedPrice6Months: number;
    predictedPrice12Months: number;
  };
  insights: string[];
  series: MarketSeriesRow[];
  disclaimer: string;
};

function demoSeries(): { month: Date; avgPrice: number; avgRent: number }[] {
  const anchor = new Date();
  anchor.setDate(1);
  anchor.setHours(12, 0, 0, 0);
  return [0, 3, 6, 9, 12].map((i) => {
    const d = new Date(anchor);
    d.setMonth(d.getMonth() - (12 - i));
    return { month: d, avgPrice: 480_000 + i * 4200, avgRent: 2100 + i * 35 };
  });
}

/**
 * City-level illustrative aggregates for marketing pages — not valuations or investment advice.
 */
export async function buildMarketAnalysis(city: string, propertyType: string): Promise<MarketCityAnalysis> {
  const cityNorm = city.trim();

  const sample = await prisma.shortTermListing
    .findMany({
      where: { city: { equals: cityNorm, mode: "insensitive" } },
      select: { nightPriceCents: true },
      take: 200,
    })
    .catch(() => [] as { nightPriceCents: number }[]);

  const avgNightly =
    sample.length > 0 ? sample.reduce((s, r) => s + r.nightPriceCents, 0) / sample.length / 100 : null;

  const base = demoSeries();
  const rows = base.map((r, i) => ({
    month: r.month,
    avgPrice: avgNightly != null ? Math.round(avgNightly * 365 + i * 800) : r.avgPrice,
    avgRent: r.avgRent,
  }));

  const series: MarketSeriesRow[] = rows.map((r, i) => ({
    date: r.month.toISOString(),
    avgPriceCents: Math.round(r.avgPrice * 100),
    avgRentCents: r.avgRent != null ? Math.round(r.avgRent * 100) : i % 3 === 0 ? 2200_00 : null,
  }));

  const prices = rows.map((r) => r.avgPrice);
  const last = prices.at(-1)!;
  const first = prices[0]!;
  const drift = first > 0 ? (last - first) / first : 0;

  return {
    label: `${propertyType} · ${cityNorm}`,
    trend: {
      trend: drift > 0.015 ? "up" : drift < -0.015 ? "down" : "flat",
      priceGrowth3mPercent: drift * 35,
      priceGrowth6mPercent: drift * 55,
      priceGrowth12mPercent: drift * 90,
      rentGrowth6mPercent: drift * 40,
    },
    marketScore: Math.min(100, Math.max(30, Math.round(55 + drift * 140))),
    confidence: sample.length >= 24 ? 78 : sample.length >= 8 ? 58 : 42,
    forecast: {
      predictedPrice3Months: Math.round(last * 100 * (1 + drift / 18)) * 100,
      predictedPrice6Months: Math.round(last * 100 * (1 + drift / 12)) * 100,
      predictedPrice12Months: Math.round(last * 100 * (1 + drift / 6)) * 100,
    },
    insights: [
      "Figures blend internal nightly-rate samples where available; treat as exploratory context.",
      `${cityNorm} bundles several micro-markets — zoom to MLS-style sub-areas before pricing.`,
      avgNightly == null ? "Insufficient rows for stable median — widen city spelling or ingest more listings." : "Sample size informs confidence only — not underwriting.",
    ],
    series,
    disclaimer:
      "Illustrative projections from heuristic blends. Not mortgage advice or a brokerage determination of value.",
  };
}
