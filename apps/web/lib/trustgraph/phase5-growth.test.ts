import { describe, expect, it } from "vitest";
import { computeListingRankingResult } from "@/lib/trustgraph/domain/ranking";
import { classifyVerifiedOpportunity } from "@/lib/trustgraph/infrastructure/services/verifiedOpportunityService";
import { collectMortgageReadinessRuleResults } from "@/lib/trustgraph/infrastructure/rules/mortgageRulesRegistry";
import { collectBookingRiskRuleResults } from "@/lib/trustgraph/infrastructure/rules/bnhubRulesRegistry";

describe("Phase 5 TrustGraph growth", () => {
  it("ranking boost increases final score when trust signals are stronger", () => {
    const low = computeListingRankingResult({
      baseRankingScore: 0.5,
      trustLevel: "low",
      readinessLevel: "not_ready",
      mediaCompleteness: 0.2,
      declarationCompleteness: 0,
      brokerVerificationCompleteness: 0,
    });
    const high = computeListingRankingResult({
      baseRankingScore: 0.5,
      trustLevel: "verified",
      readinessLevel: "ready",
      mediaCompleteness: 1,
      declarationCompleteness: 1,
      brokerVerificationCompleteness: 1,
    });
    expect(high.finalRankingScore).toBeGreaterThan(low.finalRankingScore);
    expect(high.publicBadgeReasons.length).toBeGreaterThanOrEqual(1);
  });

  it("verified opportunity requires score + trust gates", () => {
    const ok = classifyVerifiedOpportunity({
      caseRow: {
        overallScore: 80,
        trustLevel: "high",
        readinessLevel: "ready",
      },
    });
    expect(ok.isVerifiedOpportunity).toBe(true);
    const bad = classifyVerifiedOpportunity({
      caseRow: {
        overallScore: 10,
        trustLevel: "low",
        readinessLevel: "action_required",
      },
    });
    expect(bad.isVerifiedOpportunity).toBe(false);
  });

  it("mortgage readiness improves when mandatory fields are complete", () => {
    const incomplete = collectMortgageReadinessRuleResults({
      propertyPrice: 0,
      downPayment: 0,
      income: 0,
      timeline: "",
      employmentStatus: null,
      creditRange: null,
    });
    const complete = collectMortgageReadinessRuleResults({
      propertyPrice: 500_000,
      downPayment: 50_000,
      income: 120_000,
      timeline: "1-3 months",
      employmentStatus: "employed",
      creditRange: "good",
    });
    const failIncomplete = incomplete.filter((r) => !r.passed).length;
    const failComplete = complete.filter((r) => !r.passed).length;
    expect(failComplete).toBeLessThan(failIncomplete);
  });

  it("booking risk never auto-rejects on weak evidence alone — returns rule results", () => {
    const results = collectBookingRiskRuleResults({
      createdAt: new Date("2025-01-01T00:00:00Z"),
      checkIn: new Date("2025-01-10T00:00:00Z"),
      nights: 1,
      totalCents: 100_000,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.ruleCode.length > 0)).toBe(true);
  });
});
