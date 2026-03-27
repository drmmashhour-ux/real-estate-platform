/**
 * Rule-based deal analysis — explainable, not a black-box model.
 * Results are estimates for informational purposes only; not financial, legal, or investment advice.
 */

import { computeRoi, type RoiInputs, type RoiOutputs } from "@/lib/invest/roi";
import {
  DEFAULT_DEAL_THRESHOLDS,
  type DealAnalyzerThresholds,
  type DealClassificationId,
} from "@/lib/ai/deal-analyzer-config";

export type DealAnalyzerMode = "investor" | "buyer";

export type DealAnalyzerInput = {
  purchasePrice: number;
  rentEstimate: number;
  propertyTaxAnnual: number;
  condoFeesAnnual: number;
  insuranceAnnual: number;
  managementAnnual: number;
  repairsReserveAnnual: number;
  otherAnnualExpenses: number;
  otherMonthlyExpenses: number;
  interestRate: number;
  downPayment: number;
  amortizationYears: number;
  vacancyRatePercent: number;
  closingCosts: number;
  welcomeTax: number;
  locationCity: string;
  propertyType: string;
  mode: DealAnalyzerMode;
  buyerFeatureScore?: number;
  thresholds?: Partial<DealAnalyzerThresholds>;
};

export type DealRiskLevel = "low" | "medium" | "high";

export type DealMetrics = {
  purchasePrice: number;
  monthlyPayment: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRatePercent: number;
  roiPercent: number;
  cashOnCashPercent: number;
  grossYieldPercent: number;
  loanAmount: number;
  effectiveMonthlyRent: number;
};

export type DealExplanation = {
  summary: string;
  strengths: string[];
  risks: string[];
};

export type DealOpportunity = {
  id: string;
  label: string;
  detail: string;
};

export type DealAnalyzeResult = {
  metrics: DealMetrics;
  classification: DealClassificationId;
  classificationLabel: string;
  dealScore: number;
  riskLevel: DealRiskLevel;
  explanation: DealExplanation;
  opportunities: DealOpportunity[];
  riskFactors: string[];
  disclaimer: string;
};

function mergeThresholds(t?: Partial<DealAnalyzerThresholds>): DealAnalyzerThresholds {
  return { ...DEFAULT_DEAL_THRESHOLDS, ...t };
}

function classifyDeal(roiPercent: number, monthlyCashFlow: number, th: DealAnalyzerThresholds): DealClassificationId {
  if (monthlyCashFlow < 0) return "risky";
  const meetsExcellentCf =
    th.excellentCashFlowMonthlyMin <= 0
      ? monthlyCashFlow > 0
      : monthlyCashFlow >= th.excellentCashFlowMonthlyMin;
  if (roiPercent >= th.excellentRoiMin && meetsExcellentCf) return "excellent";
  if (roiPercent >= th.goodRoiMin) return "good";
  if (roiPercent >= th.averageRoiMin) return "average";
  return "risky";
}

function classificationLabel(id: DealClassificationId): string {
  switch (id) {
    case "excellent":
      return "Excellent deal";
    case "good":
      return "Good deal";
    case "average":
      return "Average deal";
    case "risky":
      return "Risky deal";
    default:
      return "Average deal";
  }
}

function roiOutputsToMetrics(r: RoiOutputs, purchasePrice: number): DealMetrics {
  return {
    monthlyPayment: r.monthlyMortgagePayment,
    monthlyExpenses: r.annualOperatingExpenses / 12,
    monthlyCashFlow: r.monthlyCashFlow,
    annualCashFlow: r.annualCashFlow,
    capRatePercent: r.capRatePercent,
    roiPercent: r.roiPercent,
    cashOnCashPercent: r.cashOnCashPercent,
    grossYieldPercent: r.grossYieldPercent,
    loanAmount: r.loanAmount,
    effectiveMonthlyRent: r.effectiveMonthlyRent,
    purchasePrice,
  };
}

function computeDealScore(mode: DealAnalyzerMode, m: DealMetrics, buyerFeatureScore: number | undefined): number {
  const roiN = Math.min(1, Math.max(0, m.roiPercent / 20));
  const cfN =
    m.monthlyCashFlow <= 0
      ? 0
      : Math.min(1, m.monthlyCashFlow / Math.max(500, m.purchasePrice * 0.002));
  const yieldN = Math.min(1, Math.max(0, m.grossYieldPercent / 12));
  const capN = Math.min(1, Math.max(0, m.capRatePercent / 10));

  if (mode === "investor") {
    const raw = roiN * 38 + cfN * 32 + yieldN * 18 + capN * 12;
    return Math.round(Math.min(100, Math.max(0, raw * 100)));
  }

  const paymentRatio = m.purchasePrice > 0 ? m.monthlyPayment / (m.purchasePrice / 1000) : 1;
  const affordN = Math.max(0, 1 - Math.min(1, paymentRatio / 8));
  const feat = buyerFeatureScore != null ? Math.min(1, Math.max(0, buyerFeatureScore)) : 0.5;
  const raw = affordN * 0.35 + feat * 0.3 + yieldN * 0.2 + roiN * 0.15;
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

function buildRisks(r: RoiOutputs, th: DealAnalyzerThresholds): { riskLevel: DealRiskLevel; factors: string[] } {
  const factors: string[] = [];
  if (r.monthlyCashFlow < 0) factors.push("negative_cash_flow");
  if (r.grossYieldPercent < th.minGrossYieldRiskPct) factors.push("high_price_vs_rent");
  const gross = r.grossAnnualIncome;
  const totalOut = r.annualOperatingExpenses + r.annualDebtService;
  if (gross > 0 && totalOut / gross > th.maxExpenseRatioWarning) factors.push("high_expense_burden");
  if (r.roiPercent < th.averageRoiMin) factors.push("low_roi");

  let riskLevel: DealRiskLevel = "low";
  if (factors.includes("negative_cash_flow") || factors.length >= 3) riskLevel = "high";
  else if (factors.length >= 1) riskLevel = "medium";

  return { riskLevel, factors };
}

function buildOpportunities(input: DealAnalyzerInput, baseline: RoiOutputs): DealOpportunity[] {
  const out: DealOpportunity[] = [];
  const m = roiOutputsToMetrics(baseline, input.purchasePrice);

  const rentBump = input.rentEstimate * 1.05;
  const baseInputs: RoiInputs = {
    purchasePrice: input.purchasePrice,
    downPayment: input.downPayment,
    mortgageInterestRate: input.interestRate,
    amortizationYears: input.amortizationYears,
    monthlyRent: input.rentEstimate,
    vacancyRatePercent: input.vacancyRatePercent,
    propertyTaxAnnual: input.propertyTaxAnnual,
    condoFeesAnnual: input.condoFeesAnnual,
    insuranceAnnual: input.insuranceAnnual,
    managementAnnual: input.managementAnnual,
    repairsReserveAnnual: input.repairsReserveAnnual,
    closingCosts: input.closingCosts,
    welcomeTax: input.welcomeTax,
    otherMonthlyExpenses: input.otherMonthlyExpenses,
    otherAnnualExpenses: input.otherAnnualExpenses,
  };

  const bumped = computeRoi({ ...baseInputs, monthlyRent: rentBump });
  if (bumped.roiPercent > m.roiPercent + 0.1) {
    out.push({
      id: "rent_up",
      label: "Increase rent (illustrative)",
      detail: `If rent were ~5% higher (~$${rentBump.toFixed(0)}/mo), estimated ROI rises from ${m.roiPercent.toFixed(1)}% to about ${bumped.roiPercent.toFixed(1)}% (estimate).`,
    });
  }

  const price = input.purchasePrice;
  const priceCut = price * 0.97;
  const downRatio = price > 0 ? input.downPayment / price : 0.2;
  const roiPriceCut = computeRoi({
    ...baseInputs,
    purchasePrice: priceCut,
    downPayment: priceCut * downRatio,
  });
  if (roiPriceCut.roiPercent > m.roiPercent + 0.2 && price > 0) {
    out.push({
      id: "price_down",
      label: "Lower purchase price (illustrative)",
      detail: `At ~3% below list (~$${priceCut.toFixed(0)}), estimated ROI could be near ${roiPriceCut.roiPercent.toFixed(1)}% (estimate).`,
    });
  }

  const rateCut = Math.max(0, input.interestRate - 0.25);
  if (rateCut < input.interestRate - 0.01) {
    const roiRate = computeRoi({ ...baseInputs, mortgageInterestRate: rateCut });
    if (roiRate.monthlyCashFlow > m.monthlyCashFlow + 1) {
      out.push({
        id: "financing",
        label: "Optimize financing (illustrative)",
        detail: `A lower rate (~${rateCut.toFixed(2)}%) could improve monthly cash flow by about $${(roiRate.monthlyCashFlow - m.monthlyCashFlow).toFixed(0)} (estimate).`,
      });
    }
  }

  return out.slice(0, 4);
}

function buildExplanation(cls: DealClassificationId, m: DealMetrics, city: string): DealExplanation {
  const strengths: string[] = [];
  const risks: string[] = [];

  if (m.monthlyCashFlow > 0) strengths.push("Positive estimated monthly cash flow after debt service.");
  else risks.push("Negative estimated monthly cash flow at these assumptions.");

  if (m.roiPercent >= 8) strengths.push(`Estimated year-1 return on equity (cash-on-cash style) near ${m.roiPercent.toFixed(1)}%.`);
  if (m.capRatePercent >= 5) strengths.push(`Cap rate (NOI / price) around ${m.capRatePercent.toFixed(1)}%.`);
  if (m.grossYieldPercent < 4) risks.push("Gross yield is modest versus price — rent may be tight vs acquisition cost.");

  let summary = "";
  switch (cls) {
    case "excellent":
      summary = `This property shows strong estimated cash flow and ROI for ${city}, which may appeal to investors — verify all numbers with a professional.`;
      break;
    case "good":
      summary = `The deal looks reasonable on paper: estimated returns are solid for ${city}, but confirm taxes, vacancy, and financing with a broker or accountant.`;
      break;
    case "average":
      summary = `Returns are moderate. The property may work with better rent, price negotiation, or financing — stress-test assumptions.`;
      break;
    case "risky":
      summary = `Estimated returns or cash flow are weak or negative at these inputs. Revisit rent, expenses, price, or financing before proceeding.`;
      break;
  }

  return { summary, strengths, risks };
}

export function analyzeDeal(input: DealAnalyzerInput): DealAnalyzeResult {
  const th = mergeThresholds(input.thresholds);

  const roiInputs: RoiInputs = {
    purchasePrice: input.purchasePrice,
    downPayment: input.downPayment,
    mortgageInterestRate: input.interestRate,
    amortizationYears: input.amortizationYears,
    monthlyRent: input.rentEstimate,
    vacancyRatePercent: input.vacancyRatePercent,
    propertyTaxAnnual: input.propertyTaxAnnual,
    condoFeesAnnual: input.condoFeesAnnual,
    insuranceAnnual: input.insuranceAnnual,
    managementAnnual: input.managementAnnual,
    repairsReserveAnnual: input.repairsReserveAnnual,
    closingCosts: input.closingCosts,
    welcomeTax: input.welcomeTax,
    otherMonthlyExpenses: input.otherMonthlyExpenses,
    otherAnnualExpenses: input.otherAnnualExpenses,
  };

  const r = computeRoi(roiInputs);
  const metrics = roiOutputsToMetrics(r, input.purchasePrice);

  const classification = classifyDeal(r.roiPercent, r.monthlyCashFlow, th);

  const { riskLevel, factors } = buildRisks(r, th);
  const dealScore = computeDealScore(input.mode, metrics, input.buyerFeatureScore);
  const explanation = buildExplanation(classification, metrics, input.locationCity);
  const opportunities = buildOpportunities(input, r);

  return {
    metrics,
    classification,
    classificationLabel: classificationLabel(classification),
    dealScore,
    riskLevel,
    explanation,
    opportunities,
    riskFactors: factors,
    disclaimer:
      "This analysis is an estimate for informational purposes only and does not constitute financial, legal, or investment advice.",
  };
}
