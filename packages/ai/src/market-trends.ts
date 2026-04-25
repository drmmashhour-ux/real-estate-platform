/**
 * Explainable trend analysis from normalized market time series — not a black-box ML model.
 * Outputs are estimates / trend analysis, not guarantees.
 */

import type { NormalizedMarketPoint } from "@/lib/market/data";

export type MarketTrendId = "rising" | "stable" | "declining";

export type MarketTrendAnalysis = {
  trend: MarketTrendId;
  confidenceScore: number;
  priceGrowth3mPercent: number | null;
  priceGrowth6mPercent: number | null;
  priceGrowth12mPercent: number | null;
  rentGrowth6mPercent: number | null;
  /** Higher = more sales activity relative to listings (demand proxy). */
  supplyDemandRatio: number | null;
  /** Change in ratio last 6m vs prior 6m (positive = demand strengthening). */
  supplyDemandDelta: number | null;
};

function pctPriceChange(points: NormalizedMarketPoint[], monthsBack: number): number | null {
  if (points.length < monthsBack + 1) return null;
  const oldP = points[points.length - 1 - monthsBack]!.avgPriceCents;
  const newP = points[points.length - 1]!.avgPriceCents;
  if (oldP <= 0) return null;
  return ((newP - oldP) / oldP) * 100;
}

function pctRentChange(points: NormalizedMarketPoint[], monthsBack: number): number | null {
  const withRent = points.filter((p) => p.avgRentCents != null && p.avgRentCents > 0);
  if (withRent.length < monthsBack + 1) return null;
  const oldR = withRent[withRent.length - 1 - monthsBack]!.avgRentCents!;
  const newR = withRent[withRent.length - 1]!.avgRentCents!;
  if (oldR <= 0) return null;
  return ((newR - oldR) / oldR) * 100;
}

function meanDemandRatio(slice: NormalizedMarketPoint[]): number | null {
  const ratios: number[] = [];
  for (const p of slice) {
    if (p.inventory != null && p.inventory > 0 && p.transactions != null) {
      ratios.push(p.transactions / p.inventory);
    } else if (p.transactions != null && (p.inventory == null || p.inventory <= 0)) {
      ratios.push(p.transactions);
    }
  }
  if (ratios.length === 0) return null;
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}

function monthOverMonthVolatility(points: NormalizedMarketPoint[]): number {
  const changes: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!.avgPriceCents;
    const b = points[i]!.avgPriceCents;
    if (a > 0) changes.push(Math.abs(((b - a) / a) * 100));
  }
  if (changes.length === 0) return 0;
  const mean = changes.reduce((x, y) => x + y, 0) / changes.length;
  const var_ = changes.reduce((s, x) => s + (x - mean) ** 2, 0) / changes.length;
  return Math.sqrt(var_);
}

export function analyzeMarketTrend(data: NormalizedMarketPoint[]): MarketTrendAnalysis {
  if (data.length < 2) {
    return {
      trend: "stable",
      confidenceScore: 15,
      priceGrowth3mPercent: null,
      priceGrowth6mPercent: null,
      priceGrowth12mPercent: null,
      rentGrowth6mPercent: null,
      supplyDemandRatio: null,
      supplyDemandDelta: null,
    };
  }

  const g3 = pctPriceChange(data, 3);
  const g6 = pctPriceChange(data, 6);
  const g12 = pctPriceChange(data, 12);
  const r6 = pctRentChange(data, 6);

  const n = data.length;
  const recent = data.slice(Math.max(0, n - 6));
  const prior = data.slice(Math.max(0, n - 12), Math.max(0, n - 6));
  const ratioRecent = meanDemandRatio(recent);
  const ratioPrior = meanDemandRatio(prior);
  const supplyDemandDelta =
    ratioRecent != null && ratioPrior != null ? ratioRecent - ratioPrior : null;

  let trend: MarketTrendId = "stable";
  const six = g6 ?? g3 ?? 0;
  const twelve = g12 ?? six;

  if (six > 0.75 || (twelve > 1.0 && six >= 0)) {
    trend = "rising";
  } else if (six < -0.75 || (twelve < -1.0 && six <= 0)) {
    trend = "declining";
  } else if (supplyDemandDelta != null && supplyDemandDelta > 0.02 && (g6 ?? 0) >= -0.3) {
    trend = "rising";
  } else if (supplyDemandDelta != null && supplyDemandDelta < -0.02 && (g6 ?? 0) <= 0.3) {
    trend = "declining";
  }

  const vol = monthOverMonthVolatility(data);
  const monthsCoverage = Math.min(24, data.length);
  let confidenceScore = Math.round(
    25 + Math.min(35, monthsCoverage * 1.4) + Math.min(25, (data.length / 24) * 25) - Math.min(25, vol * 3)
  );
  confidenceScore = Math.max(10, Math.min(100, confidenceScore));

  return {
    trend,
    confidenceScore,
    priceGrowth3mPercent: g3,
    priceGrowth6mPercent: g6,
    priceGrowth12mPercent: g12,
    rentGrowth6mPercent: r6,
    supplyDemandRatio: ratioRecent,
    supplyDemandDelta,
  };
}
