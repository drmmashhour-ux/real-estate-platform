import { describe, expect, it } from "vitest";
import type { GlobalFusionOperatingProtocol } from "./global-fusion.types";
import { buildSwarmProtocolPayload } from "./protocol-mappers/swarm-protocol-mapper.service";
import { buildGrowthLoopProtocolPayload } from "./protocol-mappers/growth-loop-protocol-mapper.service";
import { buildOperatorProtocolPayload } from "./protocol-mappers/operator-protocol-mapper.service";
import { buildPlatformCoreProtocolPayload } from "./protocol-mappers/platform-core-protocol-mapper.service";
import { buildCommandCenterProtocolPayload } from "./protocol-mappers/command-center-protocol-mapper.service";

function minimalProtocol(): GlobalFusionOperatingProtocol {
  return {
    generatedAt: new Date().toISOString(),
    active: true,
    priorities: [
      {
        id: "p1",
        title: "P",
        summary: "s",
        targetSystems: ["swarm", "growth_loop"],
        importance: "high",
      },
    ],
    risks: [
      {
        id: "s1",
        type: "risk",
        targetSystems: ["platform_core", "command_center"],
        priorityLevel: "high",
        confidence: null,
        riskLevel: "medium",
        recommendationType: "r",
        reasons: ["a"],
        sourceSystems: ["brain"],
        timestamp: new Date().toISOString(),
      },
    ],
    opportunities: [],
    blockers: [],
    directives: [
      {
        id: "d1",
        directiveType: "stabilize_funnel",
        targetSystems: ["growth_loop", "operator"],
        summary: "funnel",
        priority: "medium",
        provenance: { source: "test", generatedAt: new Date().toISOString() },
      },
    ],
    alignment: [],
    conflicts: [{ id: "c1", description: "Growth vs stability", systemsInvolved: ["growth_loop"], fusionSources: ["brain"], suggestedAttention: "review", severity: "medium" }],
    signals: [],
    meta: { protocolVersion: 1, contributingSystemsCount: 2, executiveSummaryUsed: true, governanceDecision: null, notes: [] },
  };
}

describe("protocol-mappers", () => {
  it("buildSwarmProtocolPayload returns versioned shape", () => {
    const p = buildSwarmProtocolPayload(minimalProtocol());
    expect(p.version).toBe(1);
    expect(p.objectives.length).toBeGreaterThan(0);
  });

  it("buildGrowthLoopProtocolPayload includes funnel hint when directive present", () => {
    const p = buildGrowthLoopProtocolPayload(minimalProtocol());
    expect(p.funnelFocus).toContain("funnel");
  });

  it("buildOperatorProtocolPayload lists signals for operator", () => {
    const proto = minimalProtocol();
    proto.signals = [
      {
        id: "op1",
        type: "blocker",
        targetSystems: ["operator"],
        priorityLevel: "high",
        confidence: null,
        riskLevel: "low",
        recommendationType: "b",
        reasons: ["x"],
        sourceSystems: ["cro"],
        timestamp: new Date().toISOString(),
      },
    ];
    const p = buildOperatorProtocolPayload(proto);
    expect(p.signals.length).toBe(1);
  });

  it("buildPlatformCoreProtocolPayload and command center return stable keys", () => {
    const proto = minimalProtocol();
    expect(buildPlatformCoreProtocolPayload(proto).version).toBe(1);
    expect(buildCommandCenterProtocolPayload(proto).groupedPriorities.length).toBeGreaterThan(0);
  });
});
