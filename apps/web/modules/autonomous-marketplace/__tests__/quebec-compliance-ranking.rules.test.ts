import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/feature-flags", () => ({
  complianceFlags: {
    quebecComplianceV1: true,
    propertyLegalRiskScoreV1: true,
  },
  engineFlags: {
    legalTrustRankingV1: true,
  },
}));
import {
  evaluateBlockPublishOnCriticalLegalRisk,
  evaluateBlockPublishOnFailedQuebecChecklist,
} from "../policy/rules/quebec-compliance-ranking.rules";
import type { PolicyContext } from "../policy/policy-context";

function baseCtx(overrides: Partial<PolicyContext>): PolicyContext {
  return {
    action: {
      id: "a1",
      type: "CREATE_TASK",
      target: { type: "fsbo_listing", id: "l1" },
      confidence: 0.5,
      risk: "LOW",
      title: "t",
      explanation: "e",
      humanReadableSummary: "h",
      metadata: {},
      suggestedAt: "2026-01-01T00:00:00.000Z",
      sourceDetectorId: "x",
      opportunityId: "o1",
    },
    observation: {
      id: "obs",
      target: { type: "fsbo_listing", id: "l1" },
      signals: [],
      aggregates: {},
      facts: {},
      builtAt: "2026-01-01T00:00:00.000Z",
    },
    autonomyMode: "OFF",
    targetActive: true,
    activePromotionCount: 0,
    priceDeltaTodayPct: 0,
    ...overrides,
  } as PolicyContext;
}

describe("quebec-compliance-ranking.rules", () => {
  it("blocks failed checklist via dedicated rule code", () => {
    const r = evaluateBlockPublishOnFailedQuebecChecklist(
      baseCtx({
        quebecCompliance: {
          readinessScore: 40,
          allowed: false,
          blockingIssueIds: ["qc_x"],
          reasonsPreview: [],
        },
      }),
    );
    expect(r.result).toBe("blocked");
  });

  it("blocks critical legal risk when snapshot says blocking", () => {
    const r = evaluateBlockPublishOnCriticalLegalRisk(
      baseCtx({
        propertyLegalRisk: { score: 88, level: "critical", blocking: true },
      }),
    );
    expect(r.result).toBe("blocked");
  });
});
