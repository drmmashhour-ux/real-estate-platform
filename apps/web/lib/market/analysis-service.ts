/**
 * Composes trend + forecast + score + insights for API and pages.
 */

import { getMarketHistory, normalizeMarketData } from "@/lib/market/data";
import { analyzeMarketTrend } from "@/lib/ai/market-trends";
import { forecastPrice } from "@/lib/ai/market-forecast";
import { computeMarketScore, generateMarketInsights } from "@/lib/ai/market-insights";

export const MARKET_DISCLAIMER =
  "Market trends and forecasts are estimates based on available data and are not guarantees of future performance.";

export async function buildMarketAnalysis(city: string, propertyType: string) {
  const raw = await getMarketHistory(city, propertyType);
  const normalized = normalizeMarketData(raw);
  const trend = analyzeMarketTrend(normalized);
  const fc = forecastPrice(normalized);
  const marketScore = computeMarketScore(normalized, trend, fc);
  const insights = generateMarketInsights(city, normalized, trend, fc);

  return {
    label: "estimate" as const,
    kind: "trend_analysis" as const,
    city: city.trim(),
    propertyType: propertyType.trim(),
    dataPoints: normalized.length,
    trend,
    forecast: fc,
    marketScore,
    insights,
    confidence: trend.confidenceScore,
    disclaimer: MARKET_DISCLAIMER,
    series: normalized.map((p) => ({
      date: p.date.toISOString(),
      avgPriceCents: p.avgPriceCents,
      avgRentCents: p.avgRentCents,
      transactions: p.transactions,
      inventory: p.inventory,
    })),
  };
}

export type MarketAnalysisPayload = Awaited<ReturnType<typeof buildMarketAnalysis>>;
