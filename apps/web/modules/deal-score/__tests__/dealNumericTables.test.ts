import { describe, expect, it } from "vitest";
import { scorePricePositioning, riskLevelValueFromRiskScore } from "../infrastructure/dealNumericTables";
import { computeNumericConflictPenalty } from "../infrastructure/dealConflictService";
import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";

function baseInput(over: Partial<DealAnalyzerListingInput> = {}): DealAnalyzerListingInput {
  return {
    listingId: "x",
    priceCents: 400_000_00,
    surfaceSqft: 1500,
    bedrooms: 3,
    bathrooms: 2,
    city: "Montreal",
    propertyType: "SINGLE_FAMILY",
    trustScore: 60,
    riskScore: 40,
    listingAgeDays: 10,
    documentCompleteness: 0.8,
    declarationCompleteness: 0.8,
    caseTrustLevel: null,
    caseReadinessLevel: null,
    hasVerificationCase: false,
    ...over,
  };
}

describe("dealNumericTables", () => {
  it("maps price positioning vs benchmark band", () => {
    const below = scorePricePositioning(baseInput({ priceCents: 280_000_00 }));
    const above = scorePricePositioning(baseInput({ priceCents: 620_000_00 }));
    expect(below).toBeGreaterThan(above);
  });

  it("maps risk score to discrete risk level values", () => {
    expect(riskLevelValueFromRiskScore(20)).toBe(10);
    expect(riskLevelValueFromRiskScore(40)).toBe(30);
    expect(riskLevelValueFromRiskScore(60)).toBe(60);
    expect(riskLevelValueFromRiskScore(80)).toBe(80);
  });
});

describe("computeNumericConflictPenalty", () => {
  it("applies trust/deal misalignment penalty", () => {
    expect(
      computeNumericConflictPenalty({ trustScore: 40, dealScoreRaw: 75, dealConfidence: 70 })
    ).toBe(15);
  });

  it("applies low confidence + high raw penalty", () => {
    expect(
      computeNumericConflictPenalty({ trustScore: 80, dealScoreRaw: 75, dealConfidence: 30 })
    ).toBe(10);
  });
});
