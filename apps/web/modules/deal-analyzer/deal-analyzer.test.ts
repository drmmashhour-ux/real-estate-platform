import { describe, expect, it } from "vitest";
import {
  composeAnalysisResult,
  computeAggregateRisk,
  computePricingComponent,
  pickOpportunityAndRecommendation,
} from "@/modules/deal-analyzer/domain/scoring";
import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";
import { DealRecommendation, OpportunityType } from "@/modules/deal-analyzer/domain/enums";

function baseInput(over: Partial<DealAnalyzerListingInput> = {}): DealAnalyzerListingInput {
  return {
    listingId: "x",
    priceCents: 500_000_00,
    surfaceSqft: 2000,
    bedrooms: 3,
    bathrooms: 2,
    city: "Montreal",
    propertyType: "SINGLE_FAMILY",
    trustScore: 70,
    riskScore: 30,
    listingAgeDays: 5,
    documentCompleteness: 0.8,
    declarationCompleteness: 0.75,
    caseTrustLevel: "HIGH",
    caseReadinessLevel: null,
    hasVerificationCase: true,
    ...over,
  };
}

describe("deal-analyzer scoring", () => {
  it("zero or negative price yields strong risk signal", () => {
    const input = baseInput({ priceCents: 0 });
    const pricing = computePricingComponent(input);
    const risk = computeAggregateRisk(input, pricing);
    expect(risk).toBeGreaterThanOrEqual(90);
  });

  it("low trust cannot become strong_opportunity", () => {
    const out = pickOpportunityAndRecommendation({
      investment: 75,
      risk: 40,
      pricing: 70,
      trust: 30,
      hasIncome: false,
    });
    expect(out.recommendation).not.toBe(DealRecommendation.STRONG_OPPORTUNITY);
  });

  it("insufficient rental path omits income dimension but still returns result", () => {
    const input = baseInput({ bedrooms: 0, surfaceSqft: 100 });
    const r = composeAnalysisResult(input);
    expect(r.components.incomeComponent).toBeNull();
    expect(r.warnings.some((w) => w.toLowerCase().includes("rental"))).toBe(true);
  });

  it("explanation reasons are non-empty for valid price", () => {
    const r = composeAnalysisResult(baseInput());
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.investmentScore).toBeGreaterThanOrEqual(0);
    expect(r.investmentScore).toBeLessThanOrEqual(100);
  });

  it("high risk maps to avoid or high_risk opportunity", () => {
    const input = baseInput({ trustScore: 20, riskScore: 80, declarationCompleteness: 0.1, documentCompleteness: 0.1 });
    const r = composeAnalysisResult(input);
    expect(r.recommendation === DealRecommendation.AVOID || r.opportunityType === OpportunityType.HIGH_RISK).toBe(true);
  });
});
