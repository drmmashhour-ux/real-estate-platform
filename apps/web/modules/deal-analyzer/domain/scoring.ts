import {
  ConfidenceLevel,
  DealRecommendation,
  OpportunityType,
  RiskLevelLabel,
} from "@/modules/deal-analyzer/domain/enums";
import type { ComponentScores, DealAnalysisResult, DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";

const WEIGHT_WITH_INCOME = {
  trust: 0.25,
  pricing: 0.25,
  income: 0.2,
  market: 0.15,
  readiness: 0.15,
} as const;

const WEIGHT_NO_INCOME = {
  trust: 0.3,
  pricing: 0.3,
  market: 0.2,
  readiness: 0.2,
} as const;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function riskLevelFromScore(risk0to100: number): "low" | "medium" | "high" {
  if (risk0to100 < 35) return RiskLevelLabel.LOW;
  if (risk0to100 < 60) return RiskLevelLabel.MEDIUM;
  return RiskLevelLabel.HIGH;
}

/**
 * Trust component: listing trust + declaration/doc completeness + case levels.
 */
export function computeTrustComponent(input: DealAnalyzerListingInput): number {
  let s = 50;
  if (typeof input.trustScore === "number") {
    s = input.trustScore * 0.85 + input.documentCompleteness * 100 * 0.1 + input.declarationCompleteness * 100 * 0.05;
  } else {
    s = 35 + input.documentCompleteness * 35 + input.declarationCompleteness * 30;
  }
  if (input.caseTrustLevel) {
    const t = input.caseTrustLevel.toUpperCase();
    if (t.includes("HIGH") || t.includes("VERIFIED")) s = Math.min(100, s + 5);
    if (t.includes("LOW")) s = Math.max(0, s - 12);
  }
  return clamp(Math.round(s), 0, 100);
}

/**
 * Pricing: inverse of “overpriced” heuristic using $/sqft vs rough band (CAD, same spirit as listing-investment-recommendation).
 */
export function computePricingComponent(input: DealAnalyzerListingInput): number {
  if (input.priceCents <= 0) return 0;
  const sq = input.surfaceSqft;
  if (!sq || sq < 50) return 45;
  const ppsf = (input.priceCents / 100) / sq;
  const t = (input.propertyType ?? "").toUpperCase();
  const threshold = t.includes("CONDO") ? 320 : t.includes("TOWN") ? 280 : t.includes("MULTI") ? 220 : 260;
  if (ppsf <= 0) return 0;
  if (ppsf < threshold * 0.88) return 88;
  if (ppsf < threshold) return 72;
  if (ppsf < threshold * 1.12) return 55;
  return 38;
}

export function computeReadinessComponent(input: DealAnalyzerListingInput): number {
  const base = input.declarationCompleteness * 50 + input.documentCompleteness * 50;
  return clamp(Math.round(base), 0, 100);
}

/** Income placeholder: only when rental-like and enough size signal — else null (do not invent). */
export function computeIncomeComponent(input: DealAnalyzerListingInput): number | null {
  const beds = input.bedrooms ?? 0;
  if (beds < 1 || input.priceCents <= 0) return null;
  const t = (input.propertyType ?? "").toUpperCase();
  const rentalLike = t.includes("MULTI") || t.includes("CONDO") || t.includes("SINGLE") || beds >= 2;
  if (!rentalLike) return null;
  const sq = input.surfaceSqft ?? 0;
  if (sq < 400) return null;
  const roughMonthlyRent = Math.round((input.priceCents / 100) * 0.0045);
  const yieldGuess = roughMonthlyRent > 0 ? (roughMonthlyRent * 12) / (input.priceCents / 100) : 0;
  const score = clamp(40 + yieldGuess * 400 + (input.trustScore != null ? input.trustScore * 0.15 : 0), 0, 100);
  return Math.round(score);
}

/** Market / liquidity proxy: freshness + city presence only in Phase 1. */
export function computeMarketComponent(input: DealAnalyzerListingInput): number {
  let s = 55;
  if (input.city?.trim()) s += 10;
  if (input.listingAgeDays < 14) s += 15;
  else if (input.listingAgeDays < 45) s += 8;
  else s -= 5;
  return clamp(Math.round(s), 0, 100);
}

/** Higher = worse risk (aligned with listing risk score semantics). */
export function computeAggregateRisk(input: DealAnalyzerListingInput, pricingScore: number): number {
  if (input.priceCents <= 0) return 95;
  let r = 40;
  if (typeof input.riskScore === "number") {
    r = input.riskScore * 0.55 + (100 - pricingScore) * 0.2 + (1 - input.documentCompleteness) * 25;
  } else {
    r = 50 + (1 - input.declarationCompleteness) * 25 + (1 - input.documentCompleteness) * 15;
  }
  if (typeof input.trustScore === "number" && input.trustScore < 40) r = Math.min(100, r + 15);
  if (input.declarationCompleteness < 0.35) r = Math.min(100, r + 12);
  return clamp(Math.round(r), 0, 100);
}

export function confidenceFromInputs(input: DealAnalyzerListingInput, hasIncome: boolean): ConfidenceLevel {
  let c = 3;
  if (input.surfaceSqft && input.surfaceSqft > 0) c++;
  if (input.trustScore != null && input.riskScore != null) c++;
  if (input.documentCompleteness >= 0.7) c++;
  if (input.declarationCompleteness >= 0.7) c++;
  if (hasIncome) c++;
  if (c >= 6) return ConfidenceLevel.HIGH;
  if (c >= 4) return ConfidenceLevel.MEDIUM;
  return ConfidenceLevel.LOW;
}

export function pickOpportunityAndRecommendation(args: {
  investment: number;
  risk: number;
  pricing: number;
  trust: number;
  hasIncome: boolean;
}): { opportunity: OpportunityType; recommendation: DealRecommendation } {
  const { investment, risk, pricing, trust, hasIncome } = args;

  if (risk >= 72 || trust < 35) {
    return { opportunity: OpportunityType.HIGH_RISK, recommendation: DealRecommendation.AVOID };
  }

  if (pricing < 42 && trust >= 50) {
    return { opportunity: OpportunityType.OVERPRICED, recommendation: DealRecommendation.CAUTION };
  }

  if (hasIncome && investment >= 62 && risk < 55) {
    return { opportunity: OpportunityType.CASH_FLOW_CANDIDATE, recommendation: DealRecommendation.WORTH_REVIEWING };
  }

  if (pricing >= 78 && trust >= 60 && risk < 50 && trust >= 48) {
    return { opportunity: OpportunityType.APPRECIATION_CANDIDATE, recommendation: DealRecommendation.STRONG_OPPORTUNITY };
  }

  if (trust >= 55 && investment >= 58 && risk < 58) {
    return { opportunity: OpportunityType.VALUE_ADD_CANDIDATE, recommendation: DealRecommendation.WORTH_REVIEWING };
  }

  if (investment >= 68 && risk < 52 && trust >= 48) {
    return { opportunity: OpportunityType.APPRECIATION_CANDIDATE, recommendation: DealRecommendation.STRONG_OPPORTUNITY };
  }

  if (risk >= 55 || investment < 48) {
    return { opportunity: OpportunityType.HIGH_RISK, recommendation: DealRecommendation.CAUTION };
  }

  return { opportunity: OpportunityType.VALUE_ADD_CANDIDATE, recommendation: DealRecommendation.WORTH_REVIEWING };
}

export function buildFinalInvestmentScore(components: ComponentScores): number {
  const hasIncome = components.incomeComponent != null;
  if (hasIncome && components.incomeComponent != null) {
    const inv =
      components.trustComponent * WEIGHT_WITH_INCOME.trust +
      components.pricingComponent * WEIGHT_WITH_INCOME.pricing +
      components.incomeComponent * WEIGHT_WITH_INCOME.income +
      components.marketComponent * WEIGHT_WITH_INCOME.market +
      components.readinessComponent * WEIGHT_WITH_INCOME.readiness;
    return clamp(Math.round(inv), 0, 100);
  }
  const inv =
    components.trustComponent * WEIGHT_NO_INCOME.trust +
    components.pricingComponent * WEIGHT_NO_INCOME.pricing +
    components.marketComponent * WEIGHT_NO_INCOME.market +
    components.readinessComponent * WEIGHT_NO_INCOME.readiness;
  return clamp(Math.round(inv), 0, 100);
}

export function composeAnalysisResult(input: DealAnalyzerListingInput): DealAnalysisResult {
  const trustComponent = computeTrustComponent(input);
  const pricingComponent = computePricingComponent(input);
  const readinessComponent = computeReadinessComponent(input);
  const incomeComponent = computeIncomeComponent(input);
  const marketComponent = computeMarketComponent(input);

  const components: ComponentScores = {
    trustComponent,
    pricingComponent,
    readinessComponent,
    incomeComponent,
    marketComponent,
    riskComponent: 0,
  };

  const riskScore = computeAggregateRisk(input, pricingComponent);
  components.riskComponent = riskScore;

  const investmentScore = buildFinalInvestmentScore(components);
  const confidenceLevel = confidenceFromInputs(input, incomeComponent != null);

  const { opportunity, recommendation } = pickOpportunityAndRecommendation({
    investment: investmentScore,
    risk: riskScore,
    pricing: pricingComponent,
    trust: trustComponent,
    hasIncome: incomeComponent != null,
  });

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (input.priceCents <= 0) reasons.push("Listing price is missing or invalid — opportunity cannot be assessed.");
  else reasons.push(`Price and size support a rule-based pricing signal (${pricingComponent}/100 component).`);

  if (typeof input.trustScore === "number") {
    reasons.push(`Listing trust score on file is ${input.trustScore}/100.`);
  } else {
    warnings.push("Trust scores are not fully populated — confidence is reduced.");
  }

  if (input.declarationCompleteness >= 0.65) {
    reasons.push("Seller declaration appears substantially complete for the data available.");
  } else {
    warnings.push("Seller declaration or disclosure completeness is partial — review before relying on the score.");
  }

  if (input.documentCompleteness >= 0.65) {
    reasons.push("Core document slots show reasonable coverage.");
  } else {
    warnings.push("Some required documents may still be missing.");
  }

  if (riskScore >= 60) warnings.push("Aggregated risk signals are elevated — proceed with extra diligence.");
  if (pricingComponent < 45) warnings.push("Price positioning appears stretched vs a broad $/sq ft benchmark for the type.");

  if (incomeComponent == null) {
    warnings.push("Rental income scenario was not generated — not enough structured rental signals for Phase 1.");
  }

  const scenarioPreview =
    incomeComponent != null && input.priceCents > 0
      ? {
          scenarioType: "expected",
          monthlyRent: Math.round((input.priceCents / 100) * 0.0045),
          occupancyRate: 0.92,
          monthlyCashFlow: null,
          annualRoiPercent: null,
          capRatePercent: null,
          note: "Illustrative rent uses a conservative rule-of-thumb vs list price — not a market rent appraisal.",
        }
      : null;

  const factors: DealAnalysisResult["factors"] = [
    {
      factorCode: "trust_subscore",
      factorCategory: "trust",
      factorValue: trustComponent,
      weight: incomeComponent != null ? WEIGHT_WITH_INCOME.trust : WEIGHT_NO_INCOME.trust,
      impact: trustComponent >= 60 ? ("positive" as const) : ("negative" as const),
      details: { trustScore: input.trustScore, caseTrustLevel: input.caseTrustLevel } as Record<string, unknown>,
    },
    {
      factorCode: "pricing_subscore",
      factorCategory: "pricing",
      factorValue: pricingComponent,
      weight: incomeComponent != null ? WEIGHT_WITH_INCOME.pricing : WEIGHT_NO_INCOME.pricing,
      impact: pricingComponent >= 55 ? ("positive" as const) : ("negative" as const),
      details: { priceCents: input.priceCents, surfaceSqft: input.surfaceSqft } as Record<string, unknown>,
    },
    {
      factorCode: "readiness_subscore",
      factorCategory: "readiness",
      factorValue: readinessComponent,
      weight: incomeComponent != null ? WEIGHT_WITH_INCOME.readiness : WEIGHT_NO_INCOME.readiness,
      impact: readinessComponent >= 60 ? ("positive" as const) : ("neutral" as const),
      details: {
        declarationCompleteness: input.declarationCompleteness,
        documentCompleteness: input.documentCompleteness,
      } as Record<string, unknown>,
    },
    {
      factorCode: "market_subscore",
      factorCategory: "market",
      factorValue: marketComponent,
      weight: incomeComponent != null ? WEIGHT_WITH_INCOME.market : WEIGHT_NO_INCOME.market,
      impact: marketComponent >= 58 ? ("positive" as const) : ("neutral" as const),
      details: { listingAgeDays: input.listingAgeDays, city: input.city } as Record<string, unknown>,
    },
  ];

  if (incomeComponent != null) {
    factors.push({
      factorCode: "income_subscore",
      factorCategory: "income",
      factorValue: incomeComponent,
      weight: WEIGHT_WITH_INCOME.income,
      impact: incomeComponent >= 55 ? ("positive" as const) : ("neutral" as const),
      details: { bedrooms: input.bedrooms ?? null } as Record<string, unknown>,
    });
  }

  return {
    investmentScore,
    riskScore,
    confidenceLevel,
    recommendation,
    opportunityType: opportunity,
    reasons,
    warnings,
    components,
    factors,
    scenarioPreview,
  };
}

export function riskLevelPublic(riskScore: number): "low" | "medium" | "high" {
  return riskLevelFromScore(riskScore);
}
