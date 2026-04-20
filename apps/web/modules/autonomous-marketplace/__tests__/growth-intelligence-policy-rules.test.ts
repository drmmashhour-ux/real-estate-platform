import { describe, expect, it } from "vitest";
import type { ObservationSnapshot, ProposedAction } from "../types/domain.types";
import type { PolicyContext } from "../policy/policy-context";
import {
  evaluateGrowthIntelHighValueInternalTask,
  evaluateGrowthIntelPublicPublishGuard,
  evaluateGrowthIntelWeakDataAdvisory,
} from "../policy/rules/growth-intelligence.rules";

const mockAction = (metadata: Record<string, unknown>): ProposedAction => ({
  id: "a1",
  type: "UPDATE_LISTING_COPY",
  target: { type: "fsbo_listing", id: "lst" },
  confidence: 0.6,
  risk: "LOW",
  title: "test",
  explanation: "test",
  humanReadableSummary: "test",
  metadata,
  suggestedAt: "2026-04-01T12:00:00.000Z",
  sourceDetectorId: "det",
  opportunityId: "opp",
});

const mockObservation: ObservationSnapshot = {
  id: "obs",
  target: { type: "fsbo_listing", id: "lst" },
  signals: [],
  aggregates: {},
  facts: {},
  builtAt: "2026-04-01T12:00:00.000Z",
};

function ctx(meta: Record<string, unknown>): PolicyContext {
  return {
    action: mockAction(meta),
    observation: mockObservation,
    autonomyMode: "ASSIST",
    targetActive: true,
    activePromotionCount: 0,
    priceDeltaTodayPct: 0,
  };
}

describe("growth intelligence policy rules", () => {
  it("blocks autonomous public publish / outbound / spend flags", () => {
    expect(evaluateGrowthIntelPublicPublishGuard(ctx({ growthIntelPublicPublish: true })).result).toBe("blocked");
    expect(evaluateGrowthIntelPublicPublishGuard(ctx({ growthIntelExternalMessage: true })).result).toBe("blocked");
    expect(evaluateGrowthIntelPublicPublishGuard(ctx({ growthIntelSpendBudget: true })).result).toBe("blocked");
  });

  it("passes when growth metadata absent", () => {
    expect(evaluateGrowthIntelPublicPublishGuard(ctx({})).result).toBe("passed");
  });

  it("dry-run compliance-heavy growth intel", () => {
    const r = evaluateGrowthIntelHighValueInternalTask(ctx({ growthIntel: true, growthIntelComplianceHeavy: true }));
    expect(r.result).toBe("warning");
    expect(r.dispositionHint).toBe("ALLOW_DRY_RUN");
  });

  it("warns on high-tier internal tasks without blocking by default", () => {
    const r = evaluateGrowthIntelHighValueInternalTask(
      ctx({ growthIntel: true, growthIntelPriorityTier: "urgent" }),
    );
    expect(r.result).toBe("warning");
    expect(r.dispositionHint).toBe("ALLOW_WITH_APPROVAL");
  });

  it("weak-data growth intel stays advisory only", () => {
    const r = evaluateGrowthIntelWeakDataAdvisory(ctx({ growthIntel: true, growthIntelWeakData: true }));
    expect(r.result).toBe("warning");
    expect(r.dispositionHint).toBe("ADVISORY_ONLY");
  });
});
