/**
 * Rule-based market score (0–100) and human-readable insight lines.
 */

import type { MarketTrendAnalysis } from "@/lib/ai/market-trends";
import type { MarketForecastResult } from "@/lib/ai/market-forecast";
import type { NormalizedMarketPoint } from "@/lib/market/data";

export type MarketInsightPack = {
  marketScore: number;
  insights: string[];
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Volatility penalty from month-over-month price % moves */
function priceVolatility(points: NormalizedMarketPoint[]): number {
  const changes: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!.avgPriceCents;
    const b = points[i]!.avgPriceCents;
    if (a > 0) changes.push(Math.abs(((b - a) / a) * 100));
  }
  if (changes.length === 0) return 0;
  return changes.reduce((x, y) => x + y, 0) / changes.length;
}

/**
 * Composite score: growth, rent trend, demand/supply proxy, inverse volatility.
 */
export function computeMarketScore(
  points: NormalizedMarketPoint[],
  trend: MarketTrendAnalysis,
  _forecast: MarketForecastResult
): number {
  if (points.length < 2) return 0;

  const g6 = trend.priceGrowth6mPercent ?? trend.priceGrowth3mPercent ?? 0;
  const g12 = trend.priceGrowth12mPercent ?? g6;
  const growthNorm = clamp((g6 + g12 / 2 + 5) / 25, 0, 1);

  const r6 = trend.rentGrowth6mPercent;
  const rentNorm = r6 == null ? 0.5 : clamp((r6 + 3) / 15, 0, 1);

  const sd = trend.supplyDemandDelta;
  const demandNorm = sd == null ? 0.5 : clamp(0.5 + sd * 5, 0, 1);

  const vol = priceVolatility(points);
  const volNorm = clamp(1 - vol / 8, 0, 1);

  const conf = trend.confidenceScore / 100;

  const raw =
    growthNorm * 0.32 + rentNorm * 0.2 + demandNorm * 0.22 + volNorm * 0.16 + conf * 0.1;
  return Math.round(clamp(raw * 100, 0, 100));
}

export function generateMarketInsights(
  city: string,
  points: NormalizedMarketPoint[],
  trend: MarketTrendAnalysis,
  forecast: MarketForecastResult
): string[] {
  const lines: string[] = [];
  const g6 = trend.priceGrowth6mPercent;
  const g12 = trend.priceGrowth12mPercent;

  if (g6 != null && Math.abs(g6) < 0.4 && (g12 == null || Math.abs(g12) < 0.8)) {
    lines.push(`Market trend analysis suggests ${city} is relatively stable with modest price movement in the sample period.`);
  } else if (g6 != null && g6 > 1) {
    lines.push(`Average prices in this area have increased over recent months (6-month change about ${g6.toFixed(1)}% — estimate).`);
  } else if (g6 != null && g6 < -1) {
    lines.push(`Average prices have softened recently (6-month change about ${g6.toFixed(1)}% — estimate).`);
  }

  if (trend.supplyDemandDelta != null && trend.supplyDemandDelta > 0.01) {
    lines.push("Higher sales activity relative to inventory in recent months may indicate stronger demand (illustrative ratio).");
  } else if (trend.supplyDemandDelta != null && trend.supplyDemandDelta < -0.01) {
    lines.push("Weaker sales-to-inventory balance recently may signal cooling demand in this dataset (estimate).");
  }

  if (trend.rentGrowth6mPercent != null && trend.rentGrowth6mPercent > 0.5) {
    lines.push(`Rent levels in the sample show upward movement (about ${trend.rentGrowth6mPercent.toFixed(1)}% over 6 months — estimate).`);
  }

  const slope = forecast.slopeCentsPerMonth;
  if (Math.abs(slope) > 1 && forecast.lastAvgPriceCents > 0) {
    const pctPerYear = (slope * 12) / forecast.lastAvgPriceCents;
    lines.push(
      `A simple trend line on recent data implies roughly ${(pctPerYear * 100).toFixed(1)}% annualized price drift — not a guarantee.`
    );
  }

  if (lines.length === 0) {
    lines.push(`${city}: limited history in the dataset — treat any trend analysis as highly uncertain.`);
  }

  return lines.slice(0, 5);
}
