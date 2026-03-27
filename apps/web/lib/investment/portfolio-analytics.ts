import type { InvestmentDeal } from "@prisma/client";
import { effectiveMonthlyCashFlowForDeal } from "@/lib/investment/rental-strategy-compare";

/** Minimal deal shape for portfolio math (DB or demo). */
export type PortfolioDealLike = Pick<
  InvestmentDeal,
  | "id"
  | "propertyPrice"
  | "monthlyRent"
  | "monthlyExpenses"
  | "roi"
  | "city"
  | "nightlyRate"
  | "occupancyRate"
  | "preferredStrategy"
  | "rentalType"
  | "roiLongTerm"
  | "roiShortTerm"
  | "riskScore"
  | "marketComparison"
  | "rating"
>;

export type PortfolioAnalytics = {
  totalInvestment: number;
  totalMonthlyCashFlow: number;
  averageROI: number;
  bestDeal: PortfolioDealLike | null;
  worstDeal: PortfolioDealLike | null;
  totalDeals: number;
};

/**
 * Aggregates saved deals for dashboard overview (server-side; refreshes on each request).
 */
function safePrice(d: PortfolioDealLike): number {
  const n = Number(d.propertyPrice);
  return Number.isFinite(n) ? n : 0;
}

function safeRoi(d: PortfolioDealLike): number {
  const n = Number(d.roi);
  return Number.isFinite(n) ? n : 0;
}

export function computePortfolioAnalytics(deals: readonly PortfolioDealLike[]): PortfolioAnalytics {
  const totalDeals = deals.length;
  if (totalDeals === 0) {
    return {
      totalInvestment: 0,
      totalMonthlyCashFlow: 0,
      averageROI: 0,
      bestDeal: null,
      worstDeal: null,
      totalDeals: 0,
    };
  }

  const totalInvestment = deals.reduce((s, d) => s + safePrice(d), 0);
  const totalMonthlyCashFlow = deals.reduce((s, d) => {
    const cf = effectiveMonthlyCashFlowForDeal(d);
    return s + (Number.isFinite(cf) ? cf : 0);
  }, 0);
  const roiSum = deals.reduce((s, d) => s + safeRoi(d), 0);
  const averageROI = totalDeals > 0 ? roiSum / totalDeals : 0;

  let bestDeal = deals[0]!;
  let worstDeal = deals[0]!;
  for (const d of deals) {
    if (safeRoi(d) > safeRoi(bestDeal)) bestDeal = d;
    if (safeRoi(d) < safeRoi(worstDeal)) worstDeal = d;
  }

  return {
    totalInvestment: Number.isFinite(totalInvestment) ? totalInvestment : 0,
    totalMonthlyCashFlow: Number.isFinite(totalMonthlyCashFlow) ? totalMonthlyCashFlow : 0,
    averageROI: Number.isFinite(averageROI) ? averageROI : 0,
    bestDeal,
    worstDeal,
    totalDeals,
  };
}
