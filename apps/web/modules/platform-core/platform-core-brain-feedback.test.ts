import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CoreDecisionRecord } from "./platform-core.types";

function minimalDecision(): CoreDecisionRecord {
  return {
    id: "d-feedback-1",
    source: "ADS",
    entityType: "CAMPAIGN",
    entityId: "e1",
    title: "t",
    summary: "s",
    reason: "r",
    confidenceScore: 0.8,
    status: "EXECUTED",
    actionType: "SCALE_CAMPAIGN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("emitPlatformCoreBrainFeedback resilience", () => {
  const prevCore = process.env.FEATURE_PLATFORM_CORE_V1;
  const prevIngest = process.env.FEATURE_ONE_BRAIN_V2_OUTCOME_INGESTION_V1;

  beforeEach(() => {
    vi.resetModules();
    process.env.FEATURE_PLATFORM_CORE_V1 = "true";
    process.env.FEATURE_ONE_BRAIN_V2_OUTCOME_INGESTION_V1 = "true";
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.FEATURE_PLATFORM_CORE_V1 = prevCore;
    process.env.FEATURE_ONE_BRAIN_V2_OUTCOME_INGESTION_V1 = prevIngest;
  });

  it("does not throw when createDecisionOutcomes rejects", async () => {
    vi.doMock("./brain-v2.repository", async (importOriginal) => {
      const mod = await importOriginal<typeof import("./brain-v2.repository")>();
      return {
        ...mod,
        createDecisionOutcomes: vi.fn().mockRejectedValue(new Error("simulated persistence failure")),
      };
    });
    const { emitPlatformCoreBrainFeedback } = await import("./brain-outcome-ingestion.service");
    await expect(
      emitPlatformCoreBrainFeedback({ decision: minimalDecision(), kind: "executed" }),
    ).resolves.toBeUndefined();
  });
});
