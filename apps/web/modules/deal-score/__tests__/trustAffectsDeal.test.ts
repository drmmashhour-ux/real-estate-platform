import { describe, expect, it } from "vitest";
import { composeAnalysisResult } from "@/modules/deal-analyzer/domain/scoring";
import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";

function baseInput(trustScore: number | null): DealAnalyzerListingInput {
  return {
    listingId: "listing-1",
    priceCents: 450_000_00,
    surfaceSqft: 1200,
    bedrooms: 3,
    bathrooms: 2,
    city: "Montreal",
    propertyType: "SINGLE_FAMILY",
    trustScore,
    riskScore: 35,
    listingAgeDays: 7,
    documentCompleteness: 0.75,
    declarationCompleteness: 0.75,
    caseTrustLevel: null,
    caseReadinessLevel: null,
    hasVerificationCase: true,
  };
}

describe("trust affects deterministic deal score", () => {
  it("higher listing trustScore yields higher investment score than very low trust (same other inputs)", () => {
    const high = composeAnalysisResult(baseInput(85));
    const low = composeAnalysisResult(baseInput(15));
    expect(high.investmentScore).toBeGreaterThan(low.investmentScore);
  });

  it("very low trust increases risk vs high trust", () => {
    const high = composeAnalysisResult(baseInput(80));
    const low = composeAnalysisResult(baseInput(10));
    expect(low.riskScore).toBeGreaterThanOrEqual(high.riskScore);
  });

  it("below-benchmark price per sqft yields higher investment score than stretched pricing (same trust)", () => {
    const goodPricing = composeAnalysisResult({
      ...baseInput(70),
      priceCents: 220_000_00,
      surfaceSqft: 1400,
    });
    const stretched = composeAnalysisResult({
      ...baseInput(70),
      priceCents: 950_000_00,
      surfaceSqft: 1400,
    });
    expect(goodPricing.investmentScore).toBeGreaterThan(stretched.investmentScore);
  });
});
