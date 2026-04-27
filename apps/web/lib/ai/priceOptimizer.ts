import { estimateRevenue } from "./revenueModel";

export const REVENUE_MIN_PRICE = 50;
export const REVENUE_MAX_PRICE = 5000;
/** Max single-step move for revenue optimizer (stricter than generic 10% guard unless `source=revenue_optimizer`). */
export const REVENUE_MAX_PRICE_CHANGE_PCT = 0.15;

/**
 * Simple grid search with linear “elasticity”: higher price → lower estimated conversion.
 */
export function findBestPrice(basePrice: number, conversionRate: number): number {
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    return basePrice;
  }
  const cr = Math.max(0, Math.min(1, conversionRate));
  const candidates = [basePrice * 0.9, basePrice, basePrice * 1.1];

  let bestPrice = basePrice;
  let bestRevenue = 0;

  for (const p of candidates) {
    if (!Number.isFinite(p) || p <= 0) continue;
    const estimatedConversion = cr * (basePrice / p);
    const revenue = estimateRevenue(p, estimatedConversion);
    if (revenue > bestRevenue) {
      bestRevenue = revenue;
      bestPrice = p;
    }
  }

  return bestPrice;
}

/**
 * Applies production guardrails; returns `null` if the move is unsafe or negligible.
 */
export function optimizePriceForRevenue(
  currentPrice: number,
  conversionRate: number
): { price: number; conversionRate: number } | null {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return null;
  }
  const cr = Math.max(0, Math.min(1, conversionRate));
  const bestPrice = findBestPrice(currentPrice, cr);

  if (bestPrice < REVENUE_MIN_PRICE || bestPrice > REVENUE_MAX_PRICE) {
    return null;
  }

  const pctChange = Math.abs(bestPrice - currentPrice) / currentPrice;
  if (pctChange > REVENUE_MAX_PRICE_CHANGE_PCT) {
    return null;
  }

  if (Math.abs(bestPrice - currentPrice) <= 1) {
    return null;
  }

  return { price: bestPrice, conversionRate: cr };
}
