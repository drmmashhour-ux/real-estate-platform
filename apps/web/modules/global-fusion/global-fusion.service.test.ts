import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    globalFusionFlags: {
      ...a.globalFusionFlags,
      globalFusionV1: false,
      globalFusionPersistenceV1: false,
      globalFusionInfluenceV1: false,
      globalFusionPrimaryV1: false,
    },
  };
});

vi.mock("@/modules/control-center/ai-control-center.service", () => ({
  loadAiControlCenterPayload: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

import { globalFusionFlags } from "@/config/feature-flags";
import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import { minimalControlCenterSystems } from "./test-fixtures/minimal-control-center-systems";
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import { buildGlobalFusionPayload } from "./global-fusion.service";

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

describe("buildGlobalFusionPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(minimalPayload());
    (globalFusionFlags as { globalFusionV1: boolean }).globalFusionV1 = false;
  });

  it("returns disabled payload when global fusion flag is off", async () => {
    (globalFusionFlags as { globalFusionV1: boolean }).globalFusionV1 = false;
    const p = await buildGlobalFusionPayload({});
    expect(p.enabled).toBe(false);
    expect(p.snapshot).toBeNull();
    expect(loadAiControlCenterPayload).not.toHaveBeenCalled();
  });

  it("assembles snapshot when flag on without mutating mocked control center payload", async () => {
    (globalFusionFlags as { globalFusionV1: boolean }).globalFusionV1 = true;
    const before = minimalPayload();
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(before);
    const p = await buildGlobalFusionPayload({});
    expect(p.enabled).toBe(true);
    expect(p.snapshot?.signals.length).toBe(4);
    expect(before.systems.brain.summary).toBe(minimalPayload().systems.brain.summary);
  });
});
