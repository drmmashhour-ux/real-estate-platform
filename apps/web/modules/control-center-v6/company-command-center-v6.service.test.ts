import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/control-center-v4/company-command-center-v4.service", () => ({
  loadCompanyCommandCenterV4Payload: vi.fn(),
}));

vi.mock("@/modules/control-center/ai-control-center.service", () => ({
  loadAiControlCenterPayload: vi.fn(),
}));

import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import { loadCompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.service";
import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import { minimalV4Payload } from "@/modules/control-center-v5/test-fixtures/v4-minimal";
import { loadCompanyCommandCenterV6Payload } from "./company-command-center-v6.service";

function emptyV1(): AiControlCenterPayload {
  return {
    history: [],
    systems: null as unknown as AiControlCenterPayload["systems"],
    executiveSummary: {
      overallStatus: "limited",
      criticalWarnings: [],
      topOpportunities: [],
      topRisks: [],
      systemsHealthyCount: 0,
    },
    rolloutSummary: { primarySystems: [], shadowSystems: [], influenceSystems: [], blockedSystems: [] },
    unifiedWarnings: [],
    meta: { dataFreshnessMs: 0, sourcesUsed: [], missingSources: [], systemsLoadedCount: 0 },
  };
}

describe("loadCompanyCommandCenterV6Payload", () => {
  it("assembles four modes from V4 + optional V1", async () => {
    vi.mocked(loadCompanyCommandCenterV4Payload).mockResolvedValue(minimalV4Payload());
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(emptyV1());

    const p = await loadCompanyCommandCenterV6Payload({});
    expect(p.modes.weeklyBoardPack.mode).toBe("weekly_board_pack");
    expect(p.modes.dueDiligence.mode).toBe("due_diligence");
    expect(p.modes.launchWarRoom.mode).toBe("launch_war_room");
    expect(p.modes.auditTrail.mode).toBe("audit_trail");
    expect(p.meta.sourcesUsed.some((s) => s.includes("control_center_v6"))).toBe(true);
  });

  it("does not throw when V4 rejects — returns degraded payload", async () => {
    vi.mocked(loadCompanyCommandCenterV4Payload).mockRejectedValue(new Error("boom"));
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(emptyV1());
    const p = await loadCompanyCommandCenterV6Payload({});
    expect(p.shared.meta.partialData).toBe(true);
    expect(p.meta.missingSources).toContain("v4_aggregate");
  });

  it("narrows modes when mode query is set", async () => {
    vi.mocked(loadCompanyCommandCenterV4Payload).mockResolvedValue(minimalV4Payload());
    vi.mocked(loadAiControlCenterPayload).mockResolvedValue(emptyV1());
    const p = await loadCompanyCommandCenterV6Payload({ mode: "due_diligence" });
    expect(p.meta.focusedMode).toBe("due_diligence");
    expect(p.modes.dueDiligence.diligenceSummary.length).toBeGreaterThan(2);
    expect(p.modes.weeklyBoardPack.executiveSummary).toBe("—");
  });
});
