import { beforeEach, describe, expect, it, vi } from "vitest";

const swarmOn = vi.hoisted(() => ({ value: false }));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    swarmSystemFlags: {
      get swarmSystemV1() {
        return swarmOn.value;
      },
      swarmAgentNegotiationV1: true,
      swarmAgentPersistenceV1: false,
      swarmAgentInfluenceV1: false,
      swarmAgentPrimaryV1: false,
    },
    autonomousCompanyFlags: {
      ...a.autonomousCompanyFlags,
      autonomousCompanyModeV1: false,
    },
  };
});

vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logWarn: vi.fn() }));

vi.mock("@/modules/autonomous-company/autonomous-company.service", () => ({
  runAutonomousCompanyCycle: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/modules/fusion/fusion-system.primary-surface", () => ({
  buildFusionPrimarySurface: vi.fn().mockResolvedValue({ snapshot: null, observability: null }),
}));

vi.mock("./ads-agent.service", () => ({
  runAdsAgent: vi.fn().mockResolvedValue({
    agentId: "ads",
    role: "performance",
    proposals: [
      {
        id: "pa",
        agentId: "ads",
        role: "performance",
        sourceSystems: ["ads"],
        recommendationType: "monitor",
        confidence: 0.5,
        priority: 0.5,
        risk: 0.4,
        evidenceQuality: 0.5,
        blockers: [],
        dependencies: [],
        rationale: "r",
        suggestedNextAction: "a",
        freshnessAt: new Date().toISOString(),
      },
    ],
    risks: [],
    warnings: [],
  }),
}));

vi.mock("./cro-agent.service", () => ({
  runCroAgent: vi.fn().mockResolvedValue({
    agentId: "cro",
    role: "conversion",
    proposals: [],
    risks: [],
    warnings: [],
  }),
}));
vi.mock("./brain-agent.service", () => ({
  runBrainAgent: vi.fn().mockResolvedValue({
    agentId: "brain",
    role: "intelligence",
    proposals: [],
    risks: [],
    warnings: [],
  }),
}));
vi.mock("./operator-agent.service", () => ({
  runOperatorAgent: vi.fn().mockResolvedValue({
    agentId: "operator",
    role: "execution",
    proposals: [],
    risks: [],
    warnings: [],
  }),
}));
vi.mock("./platform-core-agent.service", () => ({
  runPlatformCoreAgent: vi.fn().mockResolvedValue({
    agentId: "platform_core",
    role: "orchestration",
    proposals: [],
    risks: [],
    warnings: [],
  }),
}));
vi.mock("./strategy-agent.service", () => ({
  runStrategyAgent: vi.fn().mockResolvedValue({
    agentId: "strategy",
    role: "strategy",
    proposals: [],
    risks: [],
    warnings: [],
  }),
}));
vi.mock("./market-intel-agent.service", () => ({
  runMarketIntelAgent: vi.fn().mockResolvedValue({
    agentId: "market_intel",
    role: "market",
    proposals: [],
    risks: [],
    warnings: [],
  }),
}));
vi.mock("./content-agent.service", () => ({
  runContentAgent: vi.fn().mockResolvedValue({
    agentId: "content",
    role: "content",
    proposals: [],
    risks: [],
    warnings: [],
  }),
}));

import { resetSwarmSessionForTests, runSwarmCycle } from "./swarm-orchestrator.service";

describe("runSwarmCycle", () => {
  beforeEach(() => {
    resetSwarmSessionForTests();
    swarmOn.value = false;
  });

  it("returns null when swarm flag off", async () => {
    const r = await runSwarmCycle({ environment: "development" });
    expect(r).toBeNull();
  });

  it("returns snapshot with bundle when swarm on", async () => {
    swarmOn.value = true;
    const r = await runSwarmCycle({ environment: "development" });
    expect(r).not.toBeNull();
    expect(r!.bundle.opportunities.length).toBeGreaterThan(0);
    expect(r!.bundle.meta.agentsRun.length).toBe(8);
    expect(r!.bundle.meta.influenceApplied).toBe(false);
    expect(r!.influencedBundle).toBeNull();
    expect(r!.influenceReport).toBeNull();
  });
});
