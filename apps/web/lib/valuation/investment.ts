import type { PropertyInput, InvestmentValuationResult, ValuationExplanation } from "./types";
import type { RiskLevel } from "./constants";
import { computeSaleValuation } from "./sale";
import { computeLongTermRentValuation } from "./long-term-rent";
import { computeShortTermRentValuation } from "./short-term-rent";
import { getDataConfidenceNote } from "./confidence";

/**
 * Investment attractiveness: score 0-100, risk level, yield, strengths/weaknesses.
 */
export async function computeInvestmentValuation(input: PropertyInput): Promise<InvestmentValuationResult> {
  const [sale, longTermRent, shortTermRent] = await Promise.all([
    computeSaleValuation(input),
    computeLongTermRentValuation(input),
    computeShortTermRentValuation(input, input.listingId),
  ]);

  const purchaseValue = sale.estimatedValueCents;
  const annualRentLTR = longTermRent.monthlyRentEstimateCents * 12;
  const annualRevenueSTR = shortTermRent.expectedAnnualRevenueCents;
  const grossYieldLTR = purchaseValue > 0 ? (annualRentLTR / purchaseValue) * 100 : 0;
  const grossYieldSTR = purchaseValue > 0 ? (annualRevenueSTR / purchaseValue) * 100 : 0;
  const grossYieldEstimatePercent = (grossYieldLTR + grossYieldSTR) / 2;

  let investmentScore = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (grossYieldEstimatePercent >= 6) {
    investmentScore += 15;
    strengths.push("Strong yield potential");
  } else if (grossYieldEstimatePercent >= 4) {
    investmentScore += 5;
  } else if (grossYieldEstimatePercent < 3) {
    investmentScore -= 10;
    weaknesses.push("Below-average yield potential");
  }

  if (sale.confidenceLabel === "high") {
    investmentScore += 10;
    strengths.push("Reliable value estimate");
  } else if (sale.confidenceLabel === "low") {
    investmentScore -= 10;
    weaknesses.push("Uncertain value estimate");
  }

  if (shortTermRent.expectedMonthlyOccupancyPercent >= 70) {
    investmentScore += 10;
    strengths.push("High expected STR occupancy");
  } else if (shortTermRent.expectedMonthlyOccupancyPercent < 50) {
    investmentScore -= 5;
    weaknesses.push("Moderate STR occupancy expectation");
  }

  if (sale.comparables.length >= 5) strengths.push("Good comparable data");
  else if (sale.comparables.length < 2) {
    investmentScore -= 10;
    weaknesses.push("Limited comparable data");
  }

  investmentScore = Math.min(100, Math.max(0, investmentScore));

  let riskLevel: RiskLevel = "medium";
  if (investmentScore >= 70 && sale.confidenceLabel === "high") riskLevel = "low";
  else if (investmentScore < 40 || sale.confidenceLabel === "low") riskLevel = "high";

  const avgConfidence = (sale.confidenceScore + longTermRent.confidenceScore + shortTermRent.confidenceScore) / 3;
  const confidenceLabel = avgConfidence >= 75 ? "high" : avgConfidence >= 40 ? "medium" : "low";

  const summaryInsight =
    grossYieldSTR > grossYieldLTR
      ? "Short-term rental revenue potential exceeds long-term rent estimate in this market."
      : "Long-term rental may provide more stable income; consider your strategy.";

  const explanation: ValuationExplanation = {
    mainFactors: [
      "Estimated purchase value",
      "Long-term and short-term rental potential",
      "Market comparable quality",
    ],
    positiveFactors: strengths,
    negativeFactors: weaknesses,
    dataConfidenceNote: getDataConfidenceNote(confidenceLabel),
  };

  return {
    valuationType: "investment",
    investmentScore,
    riskLevel,
    grossYieldEstimatePercent,
    simpleRoiIndicator: grossYieldEstimatePercent > 0 ? `~${grossYieldEstimatePercent.toFixed(1)}% gross yield` : "N/A",
    strengths,
    weaknesses,
    summaryInsight,
    confidenceScore: Math.round(avgConfidence),
    confidenceLabel,
    explanation,
  };
}
