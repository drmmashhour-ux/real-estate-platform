import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { AffordabilityLevel } from "@/modules/deal-analyzer/domain/affordability";

type AffordabilityLevelValue = (typeof AffordabilityLevel)[keyof typeof AffordabilityLevel];
import { estimateMonthlyPaymentCents } from "@/modules/deal-analyzer/infrastructure/services/paymentEstimator";

export function analyzeMortgageAffordability(args: {
  listPriceCents: number;
  downPaymentCents: number | null;
  annualRate: number | null;
  termYears: number | null;
  monthlyIncomeCents: number | null;
  monthlyDebtsCents: number | null;
}): {
  estimatedMonthlyPaymentCents: number | null;
  affordabilityLevel: string;
  affordabilityRatio: number | null;
  confidenceLevel: "low" | "medium" | "high";
  warnings: string[];
  explanation: string;
} {
  const cfg = dealAnalyzerConfig.phase3.affordability;
  const disclaimers = dealAnalyzerConfig.phase3.disclaimers.affordability;

  const warnings: string[] = [disclaimers];

  const rate = args.annualRate ?? dealAnalyzerConfig.scenario.financing.defaultApr;
  const years = args.termYears ?? dealAnalyzerConfig.scenario.financing.defaultTermYears;
  const down = args.downPaymentCents ?? Math.round(args.listPriceCents * 0.2);

  const principal = Math.max(0, args.listPriceCents - down);
  const payment = estimateMonthlyPaymentCents({
    principalCents: principal,
    annualRate: rate,
    termYears: years,
  });

  const income = args.monthlyIncomeCents;
  const debts = args.monthlyDebtsCents ?? 0;

  let confidence: "low" | "medium" | "high" = "medium";
  if (args.monthlyIncomeCents == null) {
    confidence = "low";
    warnings.push("Monthly income not provided — affordability ratio cannot be computed.");
  }
  if (args.downPaymentCents == null) {
    warnings.push("Down payment assumed at 20% of list price for illustration only.");
  }

  let ratio: number | null = null;
  if (payment != null && income != null && income > 0) {
    ratio = (payment + debts) / income;
  }

  let level: AffordabilityLevelValue = AffordabilityLevel.INSUFFICIENT_DATA;
  if (ratio != null) {
    if (ratio <= cfg.likelyAffordableMax) level = AffordabilityLevel.LIKELY_AFFORDABLE;
    else if (ratio <= cfg.borderlineMax) level = AffordabilityLevel.BORDERLINE;
    else level = AffordabilityLevel.STRETCHED;
  }

  if (ratio != null && ratio > cfg.stretchedMax) {
    warnings.push("Estimated housing + debt load is high relative to stated income — not a lender approval.");
  }

  const explanation = [
    payment != null
      ? `Estimated principal & interest ~$${(payment / 100).toFixed(0)}/mo (rules-based, not a lender quote).`
      : "Could not estimate payment from inputs.",
    ratio != null
      ? `Approximate housing + debt to income ratio: ${(ratio * 100).toFixed(1)}% (informational only).`
      : "Ratio not computed due to missing income.",
  ].join(" ");

  return {
    estimatedMonthlyPaymentCents: payment,
    affordabilityLevel: level,
    affordabilityRatio: ratio,
    confidenceLevel: confidence,
    warnings,
    explanation,
  };
}
