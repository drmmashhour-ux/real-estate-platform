import { describe, expect, it } from "vitest";
import { computePricePositioning } from "@/modules/deal-analyzer/infrastructure/services/pricePositioningService";
import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";
import type { ComparableWithScore } from "@/modules/deal-analyzer/domain/comparables";
import { buildRentalScenarios } from "@/modules/deal-analyzer/infrastructure/services/scenarioSimulationService";
import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";
import { refineDealDecision } from "@/modules/deal-analyzer/infrastructure/services/decisionRefinementService";
import { DealRecommendation, OpportunityType } from "@/modules/deal-analyzer/domain/enums";
import { rankPortfolioItems } from "@/modules/deal-analyzer/infrastructure/services/portfolioRankingService";
import { PortfolioFilter } from "@/modules/deal-analyzer/domain/portfolio";
import { analyzeBnhubListingRevenue } from "@/modules/deal-analyzer/infrastructure/services/bnhubRevenueAnalysisService";
import { buildBnhubScenarios } from "@/modules/deal-analyzer/infrastructure/services/scenarioSimulationService";

function comp(
  id: string,
  priceCents: number,
  sim: number,
): ComparableWithScore {
  return {
    id,
    priceCents,
    pricePerSqft: 200,
    propertyType: "SINGLE_FAMILY",
    bedrooms: 3,
    bathrooms: 2,
    areaSqft: 1800,
    listingStatus: "ACTIVE",
    latitude: null,
    longitude: null,
    similarityScore: sim,
    distanceKm: 2,
  };
}

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

describe("deal-analyzer phase 2 comparables", () => {
  it("classifies within / above / below range", () => {
    const pool = [comp("a", 480_000_00, 0.8), comp("b", 490_000_00, 0.75), comp("c", 510_000_00, 0.72)];
    const within = computePricePositioning({ subjectPriceCents: 495_000_00, comparables: pool });
    expect(within.outcome).toBe(PricePositioningOutcome.WITHIN_COMPARABLE_RANGE);

    const below = computePricePositioning({ subjectPriceCents: 400_000_00, comparables: pool });
    expect(below.outcome).toBe(PricePositioningOutcome.BELOW_COMPARABLE_RANGE);

    const above = computePricePositioning({ subjectPriceCents: 600_000_00, comparables: pool });
    expect(above.outcome).toBe(PricePositioningOutcome.ABOVE_COMPARABLE_RANGE);
  });

  it("insufficient comps lowers confidence", () => {
    const pool = [comp("a", 500_000_00, 0.4), comp("b", 505_000_00, 0.38)];
    const out = computePricePositioning({ subjectPriceCents: 500_000_00, comparables: pool });
    expect(out.outcome).toBe(PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA);
    expect(out.confidenceLevel).toBe("low");
  });
});

describe("deal-analyzer phase 2 scenarios", () => {
  it("produces conservative vs expected vs aggressive ordering", () => {
    const rows = buildRentalScenarios({ input: baseInput(), financing: null });
    expect(rows).toHaveLength(3);
    const cash = rows.map((r) => r.monthlyCashFlowCents ?? -999999);
    expect(cash[0]!).toBeLessThanOrEqual(cash[1]!);
    expect(cash[1]!).toBeLessThanOrEqual(cash[2]!);
  });

  it("missing financing still returns rows with mortgage unavailable note", () => {
    const rows = buildRentalScenarios({ input: baseInput(), financing: null });
    expect(rows[0]?.mortgageUnavailableReason).toMatch(/not provided/i);
  });

  it("weak rent path lowers confidence", () => {
    const rows = buildRentalScenarios({
      input: baseInput({ bedrooms: 0, surfaceSqft: 100 }),
      financing: null,
    });
    expect(rows.every((r) => r.confidenceLevel === "low")).toBe(true);
  });
});

describe("deal-analyzer phase 2 decision refinement", () => {
  it("low trust cannot become strong_opportunity in refinement output", () => {
    const r = refineDealDecision({
      trustComponent: 20,
      riskScore: 40,
      confidenceScore: 80,
      positioningOutcome: PricePositioningOutcome.WITHIN_COMPARABLE_RANGE,
      phase1Recommendation: DealRecommendation.STRONG_OPPORTUNITY,
      phase1Opportunity: OpportunityType.APPRECIATION_CANDIDATE,
      bnhubCandidate: false,
    });
    expect(r.recommendation).not.toBe(DealRecommendation.STRONG_OPPORTUNITY);
  });

  it("weak confidence + weak comps moves toward insufficient_data", () => {
    const r = refineDealDecision({
      trustComponent: 60,
      riskScore: 40,
      confidenceScore: 30,
      positioningOutcome: PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA,
      phase1Recommendation: DealRecommendation.STRONG_OPPORTUNITY,
      phase1Opportunity: OpportunityType.APPRECIATION_CANDIDATE,
      bnhubCandidate: false,
    });
    expect(r.recommendation).toBe(DealRecommendation.INSUFFICIENT_DATA);
  });

  it("overpriced positioning sets opportunity", () => {
    const r = refineDealDecision({
      trustComponent: 70,
      riskScore: 40,
      confidenceScore: 70,
      positioningOutcome: PricePositioningOutcome.ABOVE_COMPARABLE_RANGE,
      phase1Recommendation: DealRecommendation.WORTH_REVIEWING,
      phase1Opportunity: OpportunityType.VALUE_ADD_CANDIDATE,
      bnhubCandidate: false,
    });
    expect(r.opportunity).toBe(OpportunityType.OVERPRICED);
  });

  it("weak comps + low confidence sets insufficient_data opportunity", () => {
    const r = refineDealDecision({
      trustComponent: 60,
      riskScore: 40,
      confidenceScore: 30,
      positioningOutcome: PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA,
      phase1Recommendation: DealRecommendation.STRONG_OPPORTUNITY,
      phase1Opportunity: OpportunityType.APPRECIATION_CANDIDATE,
      bnhubCandidate: false,
    });
    expect(r.recommendation).toBe(DealRecommendation.INSUFFICIENT_DATA);
    expect(r.opportunity).toBe(OpportunityType.INSUFFICIENT_DATA);
  });
});

describe("deal-analyzer phase 2 portfolio", () => {
  it("ranking order is deterministic for same inputs", () => {
    const a = {
      listingId: "a",
      investmentScore: 80,
      riskScore: 30,
      confidenceScore: 80,
      trustScore: 80,
      readinessSignal: 80,
      comparableConfidence: "high" as const,
      scenarioConfidence: "high" as const,
      documentCompleteness: 1,
      isBnhubCandidate: false,
    };
    const b = { ...a, listingId: "b", investmentScore: 60 };
    const r1 = rankPortfolioItems([a, b], new Set());
    const r2 = rankPortfolioItems([a, b], new Set());
    expect(r1.map((x) => x.listingId)).toEqual(r2.map((x) => x.listingId));
  });

  it("filters high trust", () => {
    const rows = [
      {
        listingId: "a",
        investmentScore: 70,
        riskScore: 40,
        confidenceScore: 70,
        trustScore: 80,
        readinessSignal: 70,
        comparableConfidence: "medium" as const,
        scenarioConfidence: "medium" as const,
        documentCompleteness: 0.9,
        isBnhubCandidate: false,
      },
      {
        listingId: "b",
        investmentScore: 90,
        riskScore: 20,
        confidenceScore: 90,
        trustScore: 40,
        readinessSignal: 50,
        comparableConfidence: "high" as const,
        scenarioConfidence: "high" as const,
        documentCompleteness: 0.9,
        isBnhubCandidate: false,
      },
    ];
    const r = rankPortfolioItems(rows, new Set([PortfolioFilter.HIGH_TRUST]));
    expect(r.every((x) => x.listingId === "a")).toBe(true);
  });
});

describe("deal-analyzer phase 2 bnhub", () => {
  it("returns structured result without throwing when listing missing", async () => {
    const r = await analyzeBnhubListingRevenue("00000000-0000-0000-0000-000000000000");
    expect(r.recommendation).toMatch(/insufficient/i);
  });

  it("buildBnhubScenarios returns three rows with net below gross", () => {
    const rows = buildBnhubScenarios({ nightPriceCents: 10_000, cleaningFeeCents: 5000 });
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.scenarioMode === "bnhub")).toBe(true);
    for (const r of rows) {
      if (r.monthlyGrossRevenueCents != null && r.monthlyNetOperatingCents != null) {
        expect(r.monthlyNetOperatingCents).toBeLessThanOrEqual(r.monthlyGrossRevenueCents);
      }
    }
  });
});
