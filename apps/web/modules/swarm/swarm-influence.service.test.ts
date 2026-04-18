import { describe, expect, it, vi } from "vitest";
import {
  applySwarmInfluence,
  evaluateSwarmInfluenceQualityGates,
  SWARM_INFLUENCE_MAX_RANK_DELTA,
} from "./swarm-influence.service";
import { buildSwarmDecisionBundle } from "./swarm-decision-bundle.service";
import type {
  SwarmAgentId,
  SwarmAgentOutput,
  SwarmAggregateScores,
  SwarmConflict,
  SwarmNegotiationResult,
  SwarmProposal,
} from "./swarm-system.types";

vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logWarn: vi.fn() }));

vi.mock("@/config/feature-flags", () => ({
  swarmSystemFlags: { swarmAgentPrimaryV1: false },
}));

function proposal(overrides: Partial<SwarmProposal> = {}): SwarmProposal {
  return {
    id: "p1",
    agentId: "ads",
    role: "performance",
    sourceSystems: ["ads"],
    recommendationType: "scale",
    confidence: 0.7,
    priority: 0.6,
    risk: 0.35,
    evidenceQuality: 0.65,
    blockers: [],
    dependencies: [],
    rationale: "test",
    suggestedNextAction: "none",
    freshnessAt: new Date().toISOString(),
    ...overrides,
  };
}

function agentOut(id: SwarmAgentId, ok = true): SwarmAgentOutput {
  return {
    agentId: id,
    role: "performance",
    proposals: [],
    risks: [],
    warnings: [],
    failureReason: ok ? undefined : "fail",
  };
}

function allHealthyOutputs(): SwarmAgentOutput[] {
  return (
    ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"] as SwarmAgentId[]
  ).map((id) => agentOut(id, true));
}

describe("applySwarmInfluence", () => {
  it("returns null bundle and report when influence disabled (flag OFF behavior)", () => {
    const scores: SwarmAggregateScores = {
      swarmConfidence: 0.7,
      swarmPriority: 0.6,
      swarmRisk: 0.3,
      swarmReadiness: 0.7,
      agreementScore: 0.65,
      evidenceScore: 0.6,
      executionSuitability: 0.55,
    };
    const p = proposal({ id: "p1" });
    const neg: SwarmNegotiationResult[] = [{ proposalId: "p1", status: "proceed", notes: [] }];
    const bundle = buildSwarmDecisionBundle({
      proposals: [p],
      conflicts: [],
      negotiationResults: neg,
      scores,
      agentsRun: ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"],
      readinessSummary: "ok",
    });
    const r = applySwarmInfluence({
      influenceEnabled: false,
      agentOutputs: allHealthyOutputs(),
      swarmScores: scores,
      swarmConflicts: [],
      swarmNegotiationResults: neg,
      swarmDecisionBundle: bundle,
    });
    expect(r.influencedBundle).toBeNull();
    expect(r.report).toBeNull();
  });

  it("does not mutate source bundle proposals", () => {
    const scores: SwarmAggregateScores = {
      swarmConfidence: 0.7,
      swarmPriority: 0.6,
      swarmRisk: 0.3,
      swarmReadiness: 0.7,
      agreementScore: 0.65,
      evidenceScore: 0.6,
      executionSuitability: 0.55,
    };
    const p = proposal({ id: "p1" });
    const beforeRef = p;
    const neg: SwarmNegotiationResult[] = [{ proposalId: "p1", status: "proceed", notes: [] }];
    const bundle = buildSwarmDecisionBundle({
      proposals: [p],
      conflicts: [],
      negotiationResults: neg,
      scores,
      agentsRun: ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"],
      readinessSummary: "ok",
    });
    applySwarmInfluence({
      influenceEnabled: true,
      agentOutputs: allHealthyOutputs(),
      swarmScores: scores,
      swarmConflicts: [],
      swarmNegotiationResults: neg,
      swarmDecisionBundle: bundle,
    });
    expect(bundle.opportunities[0]).toBe(beforeRef);
    expect(bundle.opportunities[0].influenceOverlay).toBeUndefined();
  });

  it("skips influence when quality gates fail (weak coverage)", () => {
    const scores: SwarmAggregateScores = {
      swarmConfidence: 0.7,
      swarmPriority: 0.6,
      swarmRisk: 0.3,
      swarmReadiness: 0.7,
      agreementScore: 0.65,
      evidenceScore: 0.6,
      executionSuitability: 0.55,
    };
    const p = proposal();
    const neg: SwarmNegotiationResult[] = [{ proposalId: "p1", status: "proceed", notes: [] }];
    const bundle = buildSwarmDecisionBundle({
      proposals: [p],
      conflicts: [],
      negotiationResults: neg,
      scores,
      agentsRun: ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"],
      readinessSummary: "ok",
    });
    // 3 failures, 4 successes (< 5) — `insufficient_agent_coverage` (failedAgents ≤ 3).
    const failIds = new Set<SwarmAgentId>(["platform_core", "strategy", "market_intel"]);
    const badOutputs = (
      ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel"] as SwarmAgentId[]
    ).map((id) => agentOut(id, !failIds.has(id)));
    const r = applySwarmInfluence({
      influenceEnabled: true,
      agentOutputs: badOutputs,
      swarmScores: scores,
      swarmConflicts: [],
      swarmNegotiationResults: neg,
      swarmDecisionBundle: bundle,
    });
    expect(r.influencedBundle).toBeNull();
    expect(r.report?.skippedReason).toBe("insufficient_agent_coverage");
  });

  it("applies small bounded rank boost on strong agreement", () => {
    const scores: SwarmAggregateScores = {
      swarmConfidence: 0.75,
      swarmPriority: 0.65,
      swarmRisk: 0.25,
      swarmReadiness: 0.75,
      agreementScore: 0.72,
      evidenceScore: 0.68,
      executionSuitability: 0.62,
    };
    const p = proposal({ id: "p1", risk: 0.4, evidenceQuality: 0.62 });
    const neg: SwarmNegotiationResult[] = [{ proposalId: "p1", status: "proceed", notes: [] }];
    const bundle = buildSwarmDecisionBundle({
      proposals: [p],
      conflicts: [],
      negotiationResults: neg,
      scores,
      agentsRun: ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"],
      readinessSummary: "ok",
    });
    const r = applySwarmInfluence({
      influenceEnabled: true,
      agentOutputs: allHealthyOutputs(),
      swarmScores: scores,
      swarmConflicts: [],
      swarmNegotiationResults: neg,
      swarmDecisionBundle: bundle,
    });
    expect(r.influencedBundle).not.toBeNull();
    const ip = r.influencedBundle!.opportunities.find((x) => x.id === "p1");
    expect(ip?.influenceOverlay?.tags).toContain("agreement_boost");
    expect(Math.abs(ip?.influenceOverlay?.rankAdjustment ?? 0)).toBeLessThanOrEqual(SWARM_INFLUENCE_MAX_RANK_DELTA);
  });

  it("tags low evidence with monitor_only", () => {
    const scores: SwarmAggregateScores = {
      swarmConfidence: 0.7,
      swarmPriority: 0.6,
      swarmRisk: 0.35,
      swarmReadiness: 0.65,
      agreementScore: 0.55,
      evidenceScore: 0.45,
      executionSuitability: 0.5,
    };
    const p = proposal({ evidenceQuality: 0.2 });
    const neg: SwarmNegotiationResult[] = [{ proposalId: "p1", status: "proceed", notes: [] }];
    const bundle = buildSwarmDecisionBundle({
      proposals: [p],
      conflicts: [],
      negotiationResults: neg,
      scores,
      agentsRun: ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"],
      readinessSummary: "ok",
    });
    const r = applySwarmInfluence({
      influenceEnabled: true,
      agentOutputs: allHealthyOutputs(),
      swarmScores: scores,
      swarmConflicts: [],
      swarmNegotiationResults: neg,
      swarmDecisionBundle: bundle,
    });
    expect(r.influencedBundle).not.toBeNull();
    const ip = r.influencedBundle!.opportunities.find((x) => x.id === "p1");
    expect(ip?.influenceOverlay?.tags).toContain("low_evidence");
    expect(ip?.influenceOverlay?.tags).toContain("monitor_only");
  });

  it("adds conflict caution when negotiation conflicts exist and risk is elevated", () => {
    const scores: SwarmAggregateScores = {
      swarmConfidence: 0.65,
      swarmPriority: 0.55,
      swarmRisk: 0.45,
      swarmReadiness: 0.55,
      agreementScore: 0.5,
      evidenceScore: 0.55,
      executionSuitability: 0.48,
    };
    const p = proposal({ id: "p1", risk: 0.68 });
    const conflicts: SwarmConflict[] = [
      { id: "c1", proposalIds: ["p1"], agents: ["ads", "cro"], category: "bid", summary: "x" },
    ];
    const neg: SwarmNegotiationResult[] = [{ proposalId: "p1", status: "proceed", notes: [] }];
    const bundle = buildSwarmDecisionBundle({
      proposals: [p],
      conflicts,
      negotiationResults: neg,
      scores,
      agentsRun: ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"],
      readinessSummary: "ok",
    });
    const r = applySwarmInfluence({
      influenceEnabled: true,
      agentOutputs: allHealthyOutputs(),
      swarmScores: scores,
      swarmConflicts: conflicts,
      swarmNegotiationResults: neg,
      swarmDecisionBundle: bundle,
    });
    expect(r.influencedBundle).not.toBeNull();
    const ip = r.influencedBundle!.opportunities.find((x) => x.id === "p1");
    expect(ip?.influenceOverlay?.tags).toContain("conflict_caution");
  });

  it("escalates human review when conflicts and weak evidence align", () => {
    const scores: SwarmAggregateScores = {
      swarmConfidence: 0.6,
      swarmPriority: 0.55,
      swarmRisk: 0.5,
      swarmReadiness: 0.5,
      agreementScore: 0.45,
      evidenceScore: 0.5,
      executionSuitability: 0.45,
    };
    const p = proposal({ evidenceQuality: 0.4 });
    const c1: SwarmConflict = { id: "c1", proposalIds: ["p1"], agents: ["ads", "brain"], category: "x", summary: "y" };
    const c2: SwarmConflict = { id: "c2", proposalIds: ["p1"], agents: ["cro", "brain"], category: "x", summary: "z" };
    const neg: SwarmNegotiationResult[] = [{ proposalId: "p1", status: "proceed", notes: [] }];
    const bundle = buildSwarmDecisionBundle({
      proposals: [p],
      conflicts: [c1, c2],
      negotiationResults: neg,
      scores,
      agentsRun: ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"],
      readinessSummary: "ok",
    });
    const r = applySwarmInfluence({
      influenceEnabled: true,
      agentOutputs: allHealthyOutputs(),
      swarmScores: scores,
      swarmConflicts: [c1, c2],
      swarmNegotiationResults: neg,
      swarmDecisionBundle: bundle,
    });
    expect(r.influencedBundle).not.toBeNull();
    const ip = r.influencedBundle!.opportunities.find((x) => x.id === "p1");
    expect(ip?.influenceOverlay?.tags).toContain("require_human_review");
  });

  it("does not add or remove proposal rows", () => {
    const scores: SwarmAggregateScores = {
      swarmConfidence: 0.7,
      swarmPriority: 0.6,
      swarmRisk: 0.3,
      swarmReadiness: 0.7,
      agreementScore: 0.65,
      evidenceScore: 0.6,
      executionSuitability: 0.55,
    };
    const proposals = [proposal({ id: "a" }), proposal({ id: "b", agentId: "cro" })];
    const neg: SwarmNegotiationResult[] = [
      { proposalId: "a", status: "proceed", notes: [] },
      { proposalId: "b", status: "monitor_only", notes: [] },
    ];
    const bundle = buildSwarmDecisionBundle({
      proposals,
      conflicts: [],
      negotiationResults: neg,
      scores,
      agentsRun: ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"],
      readinessSummary: "ok",
    });
    const r = applySwarmInfluence({
      influenceEnabled: true,
      agentOutputs: allHealthyOutputs(),
      swarmScores: scores,
      swarmConflicts: [],
      swarmNegotiationResults: neg,
      swarmDecisionBundle: bundle,
    });
    expect(r.influencedBundle!.opportunities.length).toBe(bundle.opportunities.length);
  });
});

describe("evaluateSwarmInfluenceQualityGates", () => {
  it("returns ok for healthy swarm-shaped input", () => {
    const scores: SwarmAggregateScores = {
      swarmConfidence: 0.7,
      swarmPriority: 0.6,
      swarmRisk: 0.3,
      swarmReadiness: 0.7,
      agreementScore: 0.65,
      evidenceScore: 0.6,
      executionSuitability: 0.55,
    };
    const p = proposal();
    const bundle = buildSwarmDecisionBundle({
      proposals: [p],
      conflicts: [],
      negotiationResults: [{ proposalId: "p1", status: "proceed", notes: [] }],
      scores,
      agentsRun: ["ads", "cro", "brain", "operator", "platform_core", "strategy", "market_intel", "content"],
      readinessSummary: "ok",
    });
    const g = evaluateSwarmInfluenceQualityGates({
      agentOutputs: allHealthyOutputs(),
      bundle,
      scores,
    });
    expect(g.ok).toBe(true);
  });
});
