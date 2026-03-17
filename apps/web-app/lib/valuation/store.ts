/**
 * Persist valuation results to property_valuations table.
 */

import { prisma } from "@/lib/db";
import type { ValuationResult } from "./types";
import type { ValuationType } from "./constants";

function toSummary(result: ValuationResult): string {
  switch (result.valuationType) {
    case "sale":
      return `Est. value $${(result.estimatedValueCents / 100).toLocaleString()}; ${result.confidenceLabel} confidence.`;
    case "long_term_rental":
      return `Est. rent $${(result.monthlyRentEstimateCents / 100).toLocaleString()}/mo; ${result.confidenceLabel} confidence.`;
    case "short_term_rental":
      return `Est. $${(result.expectedAnnualRevenueCents / 100).toLocaleString()}/yr STR revenue; ${result.recommendedNightlyRateCents / 100}/night.`;
    case "investment":
      return `Investment score ${result.investmentScore}; ${result.riskLevel} risk. ${result.summaryInsight}`;
    default:
      return "Valuation completed.";
  }
}

export async function saveValuation(
  propertyIdentityId: string,
  listingId: string | null,
  valuationType: ValuationType,
  result: ValuationResult
): Promise<string> {
  const data: {
    propertyIdentityId: string;
    listingId: string | null;
    valuationType: string;
    estimatedValue: number | null;
    valueMin: number | null;
    valueMax: number | null;
    monthlyRentEstimate: number | null;
    nightlyRateEstimate: number | null;
    annualRevenueEstimate: number | null;
    grossYieldEstimate: number | null;
    investmentScore: number | null;
    confidenceScore: number;
    confidenceLabel: string;
    valuationSummary: string;
    explanation: object;
    comparablesSummary: object | null;
    riskLevel: string | null;
    seasonalitySummary: object | null;
  } = {
    propertyIdentityId,
    listingId,
    valuationType,
    estimatedValue: null,
    valueMin: null,
    valueMax: null,
    monthlyRentEstimate: null,
    nightlyRateEstimate: null,
    annualRevenueEstimate: null,
    grossYieldEstimate: null,
    investmentScore: null,
    confidenceScore: result.confidenceScore,
    confidenceLabel: result.confidenceLabel,
    valuationSummary: toSummary(result),
    explanation: result.explanation,
    comparablesSummary: "comparables" in result ? { count: result.comparables.length, reasons: result.comparables.map((c) => c.reason) } : null,
    riskLevel: null,
    seasonalitySummary: null,
  };

  if (result.valuationType === "sale") {
    data.estimatedValue = result.estimatedValueCents;
    data.valueMin = result.valueMinCents;
    data.valueMax = result.valueMaxCents;
  } else if (result.valuationType === "long_term_rental") {
    data.monthlyRentEstimate = result.monthlyRentEstimateCents;
    data.valueMin = result.rentMinCents;
    data.valueMax = result.rentMaxCents;
  } else if (result.valuationType === "short_term_rental") {
    data.nightlyRateEstimate = result.recommendedNightlyRateCents;
    data.annualRevenueEstimate = result.expectedAnnualRevenueCents;
    data.seasonalitySummary = result.seasonalitySummary ?? null;
  } else if (result.valuationType === "investment") {
    data.investmentScore = result.investmentScore;
    data.riskLevel = result.riskLevel;
    data.grossYieldEstimate = result.grossYieldEstimatePercent ?? null;
    data.annualRevenueEstimate = undefined;
  }

  const row = await prisma.propertyValuation.create({
    data: {
      ...data,
      annualRevenueEstimate: data.annualRevenueEstimate ?? undefined,
    },
  });
  return row.id;
}
