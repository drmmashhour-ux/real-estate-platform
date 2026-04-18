import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("@/modules/control-center/ai-control-center.service", () => ({
  loadAiControlCenterPayload: vi.fn(),
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    globalFusionFlags: {
      ...a.globalFusionFlags,
      globalFusionLearningV1: false,
      globalFusionLearningPersistenceV1: false,
      globalFusionLearningAdaptiveWeightsV1: false,
    },
  };
});

import { globalFusionFlags } from "@/config/feature-flags";
import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import { minimalControlCenterSystems } from "./test-fixtures/minimal-control-center-systems";
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import { runGlobalFusionLearningCycle } from "./global-fusion-learning.service";
import { resetGlobalFusionWeightsForTests } from "./global-fusion-learning-weights.service";
import { resetGlobalFusionLearningMonitoringForTests } from "./global-fusion-learning-monitoring.service";

function minimalPayload(): AiControlCenterPayload {
  const systems = minimalControlCenterSystems();
  return {
    systems,
    executiveSummary: {
      overallStatus: "healthy",
      criticalWarnings: [],
      topOpportunities: [],
      topRisks: [],
      systemsHealthyCount: 8,
      systemsWarningCount: 0,
      systemsCriticalCount: 0,
    },
    rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
    unifiedWarnings: [],
    history: [],
    meta: {
      dataFreshnessMs: 10,
      sourcesUsed: ["test"],
      missingSources: [],
      systemsLoadedCount: 8,
    },
  };
}

describe("runGlobalFusionLearningCycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGlobalFusionWeightsForTests();
    resetGlobalFusionLearningMonitoringForTests();
    (globalFusionFlags as { globalFusionLearningV1: boolean }).globalFusionLearningV1 = false;
    (globalFusionFlags as { globalFusionLearningAdaptiveWeightsV1: boolean }).globalFusionLearningAdaptiveWeightsV1 = false;
  });

  it("skips when learning flag off", async () => {
    const s = await runGlobalFusionLearningCycle({});
    expect(s.skipped).toBe(true);
    expect(loadAiControlCenterPayload).not.toHaveBeenCalled();
  });

  it("completes without throw when learning on", async () => {
    (globalFusionFlags as { globalFusionLearningV1: boolean }).globalFusionLearningV1 = true;
    (globalFusionFlags as { globalFusionLearningAdaptiveWeightsV1: boolean }).globalFusionLearningAdaptiveWeightsV1 = true;
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(minimalPayload());
    const s = await runGlobalFusionLearningCycle({});
    expect(s.skipped).toBe(false);
    expect(s.signalsEvaluated).toBeGreaterThan(0);
  });
});
