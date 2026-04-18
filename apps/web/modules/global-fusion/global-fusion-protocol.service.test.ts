import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    globalFusionFlags: {
      ...a.globalFusionFlags,
      globalFusionV1: true,
      globalFusionProtocolV1: true,
    },
  };
});

vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logWarn: vi.fn() }));

import { globalFusionFlags } from "@/config/feature-flags";
import {
  buildGlobalFusionOperatingProtocol,
  buildGlobalFusionOperatingProtocolFromContext,
  resetGlobalFusionProtocolSignalSeqForTests,
} from "./global-fusion-protocol.service";
import { buildGlobalFusionExecutiveSummaryFromAssembly } from "./global-fusion-executive.service";
import type { GlobalFusionExecutiveAssemblyInput, GlobalFusionPayload, GlobalFusionSnapshot } from "./global-fusion.types";
import { resetGlobalFusionProtocolMonitoringForTests } from "./global-fusion-protocol-monitoring.service";

function minimalSnap(): GlobalFusionSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    opportunities: [{ id: "o1", title: "O", systems: ["brain"], confidence: 0.7, rationale: "op" }],
    risks: [],
    recommendations: [
      {
        kind: "prioritize_growth",
        title: "G",
        why: "grow",
        systemsAgreed: ["brain"],
        systemsDisagreed: [],
        confidenceSummary: "c",
        riskSummary: "r",
        evidenceSummary: "e",
      },
    ],
    conflicts: [],
    scores: {
      fusedConfidence: 0.7,
      fusedPriority: 0.6,
      fusedRisk: 0.3,
      actionability: 0.6,
      agreementScore: 0.7,
      evidenceScore: 0.6,
    },
    signals: [],
    influence: null,
  };
}

function assembly(): GlobalFusionExecutiveAssemblyInput {
  const fusionPayload: GlobalFusionPayload = {
    enabled: true,
    snapshot: minimalSnap(),
    health: { overallStatus: "ok", observationalWarnings: [], insufficientEvidenceCount: 0, missingSourceCount: 0 },
    meta: {
      dataFreshnessMs: 1,
      sourcesUsed: ["brain"],
      missingSources: [],
      contributingSystemsCount: 1,
      normalizedSignalCount: 1,
      conflictCount: 0,
      recommendationCount: 1,
      persistenceLogged: false,
      influenceFlag: false,
      primaryFlag: true,
      influenceApplied: false,
      malformedNormalizedCount: 0,
    },
  };
  return {
    fusionPayload,
    primaryResult: null,
    monitoring: {
      runsTotal: 10,
      fallbackRate: 0.1,
      missingSourceRate: 0.1,
      conflictRate: 0.2,
      disagreementRate: 0.2,
      lowEvidenceRate: 0.2,
      anomalyRate: 0.05,
      unstableOrderingRate: 0.05,
      malformedInputRate: 0.02,
    },
    governanceSnapshot: null,
    learningSummary: null,
    learning: null,
    freezeState: { learningFrozen: false, influenceFrozen: false, reason: null, frozenAt: null },
  };
}

describe("global-fusion-protocol.service", () => {
  beforeEach(() => {
    resetGlobalFusionProtocolSignalSeqForTests();
    resetGlobalFusionProtocolMonitoringForTests();
    (globalFusionFlags as { globalFusionProtocolV1: boolean }).globalFusionProtocolV1 = true;
  });

  it("buildGlobalFusionOperatingProtocolFromContext produces signals and does not mutate executive", () => {
    const a = assembly();
    const exec = buildGlobalFusionExecutiveSummaryFromAssembly(a, null);
    const before = JSON.stringify(exec);
    const protocol = buildGlobalFusionOperatingProtocolFromContext(exec, a);
    expect(JSON.stringify(exec)).toBe(before);
    expect(protocol.active).toBe(true);
    expect(protocol.signals.length).toBeGreaterThan(0);
    expect(protocol.meta.protocolVersion).toBe(1);
  });

  it("returns inactive protocol when PROTOCOL_V1 flag is off", async () => {
    (globalFusionFlags as { globalFusionProtocolV1: boolean }).globalFusionProtocolV1 = false;
    const { protocol } = await buildGlobalFusionOperatingProtocol({});
    expect(protocol.active).toBe(false);
    expect(protocol.inactiveReason).toContain("PROTOCOL_V1_off");
  });
});
