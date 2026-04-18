import { describe, expect, it, vi } from "vitest";
import { detectSwarmConflicts, negotiateProposals } from "./swarm-negotiation.service";
import type { SwarmProposal } from "./swarm-system.types";

vi.mock("@/config/feature-flags", () => ({
  swarmSystemFlags: {
    swarmSystemV1: true,
    swarmAgentNegotiationV1: true,
    swarmAgentPersistenceV1: false,
    swarmAgentInfluenceV1: false,
    swarmAgentPrimaryV1: false,
  },
}));

function base(): SwarmProposal {
  return {
    id: "p1",
    agentId: "ads",
    role: "performance",
    sourceSystems: ["ads"],
    recommendationType: "scale",
    confidence: 0.6,
    priority: 0.6,
    risk: 0.4,
    evidenceQuality: 0.5,
    blockers: [],
    dependencies: [],
    rationale: "",
    suggestedNextAction: "",
    freshnessAt: new Date().toISOString(),
  };
}

describe("detectSwarmConflicts", () => {
  it("detects scale vs reduce", () => {
    const c = detectSwarmConflicts([
      { ...base(), id: "a", recommendationType: "scale" },
      { ...base(), id: "b", agentId: "cro", recommendationType: "reduce" },
    ]);
    expect(c.some((x) => x.category === "scale_vs_reduce")).toBe(true);
  });

  it("detects ads vs brain tension", () => {
    const c = detectSwarmConflicts([
      { ...base(), id: "a", agentId: "ads", recommendationType: "scale" },
      { ...base(), id: "b", agentId: "brain", recommendationType: "caution" },
    ]);
    expect(c.some((x) => x.category === "scale_vs_evidence_caution")).toBe(true);
  });
});

describe("negotiateProposals", () => {
  it("returns one result per proposal", () => {
    const props = [base(), { ...base(), id: "p2", agentId: "cro" }];
    const n = negotiateProposals(props, []);
    expect(n).toHaveLength(2);
  });
});
