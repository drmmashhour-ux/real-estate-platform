/**
 * Rule-based rental deal analysis (estimates only). No external AI calls.
 */

import { computeRoi, type RoiInputs } from "@/lib/invest/roi";

export type DealAnalyzerMode = "investor" | "buyer";

export type DealClassificationId = "excellent" | "good" | "average" | "risky";

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
  thresholds?: Partial<{ excellentRoi: number; goodRoi: number }>;
};

export type DealExplain = {
  summary: string;
  strengths: string[];
  risks: string[];
};

export type DealOpportunityInsight = { id: string; label: string; detail: string };

export type DealAnalyzeResult = {
  dealScore: number;
  classification: DealClassificationId;
  classificationLabel: string;
  metrics: {
    roiPercent: number;
    monthlyCashFlow: number;
    capRatePercent: number;
    cashOnCashPercent: number;
  };
  explanation: DealExplain;
  disclaimer: string;
  opportunities: DealOpportunityInsight[];
  riskLevel: "low" | "medium" | "high";
};

const DISCLAIMER =
  "This is a rule-based illustrative estimate using your inputs. Not investment, tax, or legal advice.";

function toRoiInputs(input: DealAnalyzerInput): RoiInputs {
  return {
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
}

function classifyFromScore(score: number): { id: DealClassificationId; label: string } {
  if (score >= 80) return { id: "excellent", label: "Strong (estimate)" };
  if (score >= 65) return { id: "good", label: "Fair (estimate)" };
  if (score >= 45) return { id: "average", label: "Neutral (estimate)" };
  return { id: "risky", label: "Caution (estimate)" };
}

function riskFromMetrics(
  score: number,
  monthlyCashFlow: number,
  capRatePercent: number,
  vacancyRatePercent: number
): "low" | "medium" | "high" {
  if (monthlyCashFlow < -250 || capRatePercent < 1.5) return "high";
  if (vacancyRatePercent > 12) return "medium";
  if (score < 45 || monthlyCashFlow < 0) return "medium";
  return score >= 70 ? "low" : "medium";
}

function buildOpportunities(
  roi: ReturnType<typeof computeRoi>,
  input: DealAnalyzerInput
): DealOpportunityInsight[] {
  const out: DealOpportunityInsight[] = [];
  if (roi.monthlyCashFlow > 0 && roi.roiPercent >= 6) {
    out.push({
      id: "cash-kicker",
      label: "Yield",
      detail: "Cash flow and CoC look supportive at these assumptions — stress-test rent and vacancy before acting.",
    });
  }
  if (input.mode === "buyer" && (input.buyerFeatureScore ?? 0) > 0.6) {
    out.push({
      id: "livability",
      label: "Fit",
      detail: "Bed/bath/square footage mix looks competitive for the price band (heuristic).",
    });
  }
  if (roi.capRatePercent >= 4 && roi.monthlyCashFlow < 0) {
    out.push({
      id: "capital-structure",
      label: "Leverage",
      detail: "Positive cap rate with negative cash flow often points to financing or closing-cost pressure — revisit rate, amortization, and down payment.",
    });
  }
  if (out.length === 0) {
    out.push({
      id: "verify-comps",
      label: "Verification",
      detail: "Compare to recent rentals in the same sub-market; small rent or expense changes move these numbers quickly.",
    });
  }
  return out.slice(0, 3);
}

export function analyzeDeal(input: DealAnalyzerInput): DealAnalyzeResult {
  const roi = computeRoi(toRoiInputs(input));
  const bf = Math.min(1, Math.max(0, input.buyerFeatureScore ?? 0.5));

  let score = 38;
  score += Math.min(38, Math.max(0, roi.roiPercent) * 1.9);
  score += Math.min(16, Math.max(0, roi.monthlyCashFlow) / 20);
  score += Math.min(10, Math.max(0, roi.capRatePercent) * 1.1);
  if (roi.monthlyCashFlow < -200) score -= 28;
  else if (roi.monthlyCashFlow < 0) score -= 16;
  if (input.mode === "buyer") {
    score += bf * 10;
  }

  const excellent = input.thresholds?.excellentRoi ?? 10;
  const good = input.thresholds?.goodRoi ?? 6;
  if (roi.roiPercent >= excellent) score = Math.max(score, 78);
  else if (roi.roiPercent >= good) score = Math.max(score, 62);

  const dealScore = Math.round(Math.min(100, Math.max(0, score)));
  const { id: classification, label: classificationLabel } = classifyFromScore(dealScore);

  const strengths: string[] = [];
  const risks: string[] = [];
  if (roi.roiPercent >= 8) strengths.push("Cash-on-cash (Y1 est.) is in a healthy range for levered rental math.");
  else if (roi.roiPercent >= 4) strengths.push("Returns are positive on paper at your inputs — verify rent comps.");
  if (roi.monthlyCashFlow > 0) strengths.push("Monthly cash flow is positive before major unexpected repairs.");
  else risks.push("Monthly cash flow is thin or negative — small rent or expense changes matter.");

  if (roi.capRatePercent >= 4) strengths.push("Cap rate suggests reasonable net operating income versus price (estimate).");
  else risks.push("Cap rate is compressed — price may bake in growth you need to believe in.");

  if (input.vacancyRatePercent > 8) {
    risks.push(`Vacancy allowance is ${input.vacancyRatePercent}% — ensure it matches local STR/LTR reality.`);
  }

  const explanation: DealExplain = {
    summary:
      `Estimated Y1 performance in ${input.locationCity} for ${input.propertyType}: ` +
      `${roi.roiPercent.toFixed(1)}% CoC-style ROI, ~$${roi.monthlyCashFlow.toFixed(0)}/mo cash flow, ` +
      `${roi.capRatePercent.toFixed(2)}% cap (illustrative).`,
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 4),
  };

  const riskLevel = riskFromMetrics(dealScore, roi.monthlyCashFlow, roi.capRatePercent, input.vacancyRatePercent);

  return {
    dealScore,
    classification,
    classificationLabel,
    metrics: {
      roiPercent: roi.roiPercent,
      monthlyCashFlow: roi.monthlyCashFlow,
      capRatePercent: roi.capRatePercent,
      cashOnCashPercent: roi.cashOnCashPercent,
    },
    explanation,
    disclaimer: DISCLAIMER,
    opportunities: buildOpportunities(roi, input),
    riskLevel,
  };
}
