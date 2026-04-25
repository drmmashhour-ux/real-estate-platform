/**
 * Simple explainable forecast: moving average baseline + linear trend on recent window.
 * Estimates only — not guaranteed future prices.
 */

import type { NormalizedMarketPoint } from "@/lib/market/data";

export type MarketForecastResult = {
  method: "moving_average_plus_linear_trend";
  windowMonths: number;
  /** Slope of avg price (cents per month) over the fit window */
  slopeCentsPerMonth: number;
  /** Last observed average price (cents) */
  lastAvgPriceCents: number;
  predictedPrice3Months: number;
  predictedPrice6Months: number;
  predictedPrice12Months: number;
};

function linearRegression(points: { t: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  let sumT = 0,
    sumY = 0,
    sumTT = 0,
    sumTY = 0;
  for (const p of points) {
    sumT += p.t;
    sumY += p.y;
    sumTT += p.t * p.t;
    sumTY += p.t * p.y;
  }
  const denom = n * sumTT - sumT * sumT;
  if (Math.abs(denom) < 1e-9) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumTY - sumT * sumY) / denom;
  const intercept = (sumY - slope * sumT) / n;
  return { slope, intercept };
}

export function forecastPrice(data: NormalizedMarketPoint[]): MarketForecastResult {
  if (data.length === 0) {
    return {
      method: "moving_average_plus_linear_trend",
      windowMonths: 0,
      slopeCentsPerMonth: 0,
      lastAvgPriceCents: 0,
      predictedPrice3Months: 0,
      predictedPrice6Months: 0,
      predictedPrice12Months: 0,
    };
  }

  const windowMonths = Math.min(18, Math.max(3, data.length));
  const slice = data.slice(-windowMonths);
  const last = slice[slice.length - 1]!;
  const lastAvgPriceCents = last.avgPriceCents;

  if (slice.length < 2) {
    return {
      method: "moving_average_plus_linear_trend",
      windowMonths: slice.length,
      slopeCentsPerMonth: 0,
      lastAvgPriceCents,
      predictedPrice3Months: lastAvgPriceCents,
      predictedPrice6Months: lastAvgPriceCents,
      predictedPrice12Months: lastAvgPriceCents,
    };
  }

  const series = slice.map((p, i) => ({ t: i, y: p.avgPriceCents }));
  const { slope } = linearRegression(series);
  const slopeCentsPerMonth = slope;

  const lastIndex = slice.length - 1;
  const predictAt = (monthsAhead: number) => {
    const t = lastIndex + monthsAhead;
    const raw = slope * t + (lastAvgPriceCents - slope * lastIndex);
    return Math.max(0, Math.round(raw));
  };

  return {
    method: "moving_average_plus_linear_trend",
    windowMonths: slice.length,
    slopeCentsPerMonth: slopeCentsPerMonth,
    lastAvgPriceCents,
    predictedPrice3Months: predictAt(3),
    predictedPrice6Months: predictAt(6),
    predictedPrice12Months: predictAt(12),
  };
}
