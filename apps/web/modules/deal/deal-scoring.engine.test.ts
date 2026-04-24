import { describe, expect, it } from "vitest";
import {
  categoryFromScore,
  computeDealScoring,
  recommendationFrom,
  type DealScoringContext,
} from "./deal-scoring.engine";

const baseCtx = (over: Partial<DealScoringContext> = {}): DealScoringContext => ({
  dealPriceCad: 480_000,
  listPriceCad: 500_000,
  listVsMarketPct: -3,
  city: "Montreal",
  listingRankingScore: 72,
  conditionLabel: "Good overall",
  knownIssuesPresent: false,
  financingStrength: "strong",
  inspectionStress: "low",
  pendingClosingConditions: 1,
  daysSinceLastActivity: 4,
  rejectedNegotiationCount: 0,
  esgComposite: null,
  investorImpliedYieldPct: null,
  isInvestmentDeal: false,
  dealStatus: "accepted",
  ...over,
});

describe("deal-scoring.engine", () => {
  it("returns healthy score and ACCEPT for strong low-risk context", () => {
    const r = computeDealScoring(baseCtx());
    expect(r.score).toBeGreaterThanOrEqual(65);
    expect(r.riskLevel).toBe("LOW");
    expect(["ACCEPT", "REVIEW"]).toContain(r.recommendation);
    expect(r.strengths.length + r.risks.length).toBeGreaterThan(0);
  });

  it("forces reject path for cancelled deals", () => {
    const r = computeDealScoring(baseCtx({ dealStatus: "cancelled" }));
    expect(r.category).toBe("REJECT");
    expect(r.recommendation).toBe("REJECT");
    expect(r.score).toBeLessThanOrEqual(15);
  });

  it("elevates risk with idle time and inspection stress", () => {
    const r = computeDealScoring(
      baseCtx({
        daysSinceLastActivity: 25,
        inspectionStress: "high",
        pendingClosingConditions: 4,
        financingStrength: "weak",
        dealStatus: "financing",
      }),
    );
    expect(["MEDIUM", "HIGH"]).toContain(r.riskLevel);
    expect(r.recommendation).not.toBe("ACCEPT");
  });

  it("maps category bands from score and risk", () => {
    expect(categoryFromScore(82, "LOW")).toBe("EXCELLENT");
    expect(categoryFromScore(60, "LOW")).toBe("GOOD");
    expect(categoryFromScore(45, "MEDIUM")).toBe("RISKY");
    expect(categoryFromScore(30, "HIGH")).toBe("REJECT");
  });

  it("aligns recommendation with category and risk", () => {
    expect(recommendationFrom("REJECT", "LOW")).toBe("REJECT");
    expect(recommendationFrom("RISKY", "MEDIUM")).toBe("REVIEW");
    expect(recommendationFrom("EXCELLENT", "LOW")).toBe("ACCEPT");
  });
});
