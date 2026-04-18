import { describe, expect, it, beforeEach } from "vitest";
import {
  recordProtocolBuild,
  getProtocolMonitoringSummary,
  resetGlobalFusionProtocolMonitoringForTests,
} from "./global-fusion-protocol-monitoring.service";
import type { GlobalFusionOperatingProtocol } from "./global-fusion.types";

function minimalProtocol(): GlobalFusionOperatingProtocol {
  return {
    generatedAt: new Date().toISOString(),
    active: true,
    priorities: [],
    risks: [],
    opportunities: [],
    blockers: [],
    directives: [{ id: "d", directiveType: "alignment_check", targetSystems: ["swarm"], summary: "s", priority: "low", provenance: { source: "t", generatedAt: new Date().toISOString() } }],
    alignment: [{ id: "a", theme: "t", supportedSystems: ["operator"], strength: 0.3, rationale: "r" }],
    conflicts: [],
    signals: [
      {
        id: "s",
        type: "priority",
        targetSystems: ["swarm", "growth_loop"],
        priorityLevel: "medium",
        confidence: 0.5,
        riskLevel: null,
        recommendationType: null,
        reasons: [],
        sourceSystems: ["brain"],
        timestamp: new Date().toISOString(),
      },
    ],
    meta: { protocolVersion: 1, contributingSystemsCount: 1, executiveSummaryUsed: true, governanceDecision: null, notes: [] },
  };
}

describe("global-fusion-protocol-monitoring", () => {
  beforeEach(() => {
    resetGlobalFusionProtocolMonitoringForTests();
  });

  it("records when monitoring flag path is used", () => {
    recordProtocolBuild(minimalProtocol(), true);
    const m = getProtocolMonitoringSummary();
    expect(m.builds).toBe(1);
    expect(m.signalsTotal).toBeGreaterThan(0);
  });

  it("skips counters when monitoring disabled", () => {
    recordProtocolBuild(minimalProtocol(), false);
    expect(getProtocolMonitoringSummary().builds).toBe(0);
  });
});
