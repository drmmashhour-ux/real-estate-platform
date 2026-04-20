import { describe, expect, it } from "vitest";
import { applyLegalTrustRanking, computeLegalTrustRankingImpact } from "../legal-trust-ranking.service";
import type { TrustScore } from "@/modules/trust/trust.types";

const ts = (n: number): TrustScore => ({ score: n, level: "medium", confidence: "medium", factors: [] });

describe("legal-trust-ranking.service", () => {
  it("bounded dampening for elevated legal risk on visible inventory", () => {
    const impact = computeLegalTrustRankingImpact({
      listingId: "l1",
      trustScore: ts(74),
      publishSummary: {
        listingId: "l1",
        readinessScore: 72,
        legalRiskScore: 72,
        blockingIssues: [],
        warnings: [],
        requiredChecklistPassed: true,
      },
      prepublishBlocked: false,
      isPublishedVisible: true,
    });
    expect(impact.finalMultiplier).toBeGreaterThan(0);
    expect(impact.finalMultiplier).toBeLessThanOrEqual(1);
    expect(impact.reasons.length).toBeGreaterThan(0);
  });

  it("restricted exposure when prepublish blocked and not yet visible", () => {
    const impact = computeLegalTrustRankingImpact({
      listingId: "l2",
      trustScore: ts(90),
      publishSummary: null,
      prepublishBlocked: true,
      isPublishedVisible: false,
    });
    expect(impact.finalMultiplier).toBe(0);
    expect(impact.exposureLevel).toBe("restricted");
  });

  it("applyLegalTrustRanking clamps finalScore", () => {
    const impact = computeLegalTrustRankingImpact({
      listingId: "l3",
      trustScore: ts(85),
      publishSummary: {
        listingId: "l3",
        readinessScore: 94,
        legalRiskScore: 18,
        blockingIssues: [],
        warnings: [],
        requiredChecklistPassed: true,
      },
      prepublishBlocked: false,
      isPublishedVisible: true,
    });
    const out = applyLegalTrustRanking(210, impact);
    expect(out.finalScore).toBeGreaterThan(0);
    expect(out.finalScore).toBeLessThanOrEqual(210 * 1.18);
  });
});
