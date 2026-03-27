/** Cash-on-cash style metrics for MVP deal analyzer. */
export function computeDealMetrics(propertyPrice: number, monthlyRent: number, monthlyExpenses: number) {
  const monthlyCashFlow = monthlyRent - monthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  const roi = propertyPrice > 0 ? (annualCashFlow / propertyPrice) * 100 : 0;
  return { monthlyCashFlow, annualCashFlow, roi };
}

export {
  computeInvestmentInsights,
  computeRating,
  computeRiskScore,
  getInsightTone,
  getInsightToneFromString,
  getRiskScoreTone,
  insightPillClass,
  type InvestmentRating,
  type InsightTone,
} from "./investment-insights";

export {
  compareDealToMarket,
  getMarketComparisonTone,
  getMarketComparisonToneFromString,
  isMarketCity,
  marketData,
  MARKET_CITIES,
  type MarketCity,
  type MarketComparisonLabel,
} from "./market-data";
