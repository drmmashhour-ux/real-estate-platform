import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AssistantRecommendation } from "./operator.types";
import { evaluateBudgetGuardrails } from "./operator-budget-guardrails.service";
import { computeProposedBudgetFromRecommendation } from "./operator-budget-prep.service";
import { resolveConflicts } from "./operator-conflict-engine.service";
import { buildExecutionPlanFromScored } from "./operator-execution-planner.service";
import { scoreRecommendation } from "./operator-priority.service";
import { simulateExecutionPlan } from "./operator-simulation.service";
import type { OperatorScoredRecommendation } from "./operator-v2.types";
import { createMetaBudgetAdapter } from "./provider-sync/meta-budget.adapter";

vi.mock("@/modules/platform-core/brain-v2.repository", () => ({
  getCurrentSourceWeights: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/config/feature-flags", () => ({
  operatorV2Flags: {
    operatorV2BudgetSyncV1: true,
    operatorExternalSyncV1: false,
    operatorProviderMetaV1: false,
    operatorProviderGoogleV1: false,
    operatorV2PriorityV1: false,
    operatorV2ConflictEngineV1: true,
    operatorV2ExecutionPlanV1: false,
    operatorV2SimulationV1: false,
  },
  oneBrainV2Flags: {
    oneBrainV2AdaptiveV1: false,
    oneBrainV2OutcomeIngestionV1: false,
    oneBrainV2RankingWeightingV1: false,
  },
  isOperatorExternalBudgetWriteEnabled: () => false,
}));

describe("operator-budget-guardrails.service", () => {
  const base = {
    currentBudget: 100,
    proposedBudget: 100,
    confidenceScore: 0.7,
    approvalStatus: "APPROVED",
    hasConflicts: false,
    environment: "production" as const,
    evidenceScore: 0.6,
  };

  it("blocks low confidence", () => {
    const g = evaluateBudgetGuardrails({ ...base, confidenceScore: 0.5 });
    expect(g.allowed).toBe(false);
    expect(g.blockingReasons.some((x) => x.includes("Confidence"))).toBe(true);
  });

  it("blocks LTV below CPL", () => {
    const g = evaluateBudgetGuardrails({
      ...base,
      ltv: 10,
      cpl: 20,
      profitabilityStatus: "PROFITABLE",
    });
    expect(g.allowed).toBe(false);
    expect(g.blockingReasons.some((x) => x.includes("LTV"))).toBe(true);
  });

  it("caps >30% increase", () => {
    const g = evaluateBudgetGuardrails({ ...base, proposedBudget: 200 });
    expect(g.cappedBudget).toBe(130);
    expect(g.warnings.some((w) => w.includes("30%"))).toBe(true);
  });

  it("caps >30% decrease", () => {
    const g = evaluateBudgetGuardrails({ ...base, proposedBudget: 10 });
    expect(g.cappedBudget).toBe(70);
    expect(g.warnings.some((w) => w.includes("30%"))).toBe(true);
  });

  it("blocks unapproved actions when not simulateOnly", () => {
    const g = evaluateBudgetGuardrails({ ...base, approvalStatus: "PENDING" });
    expect(g.allowed).toBe(false);
  });

  it("skips approval check when simulateOnly", () => {
    const g = evaluateBudgetGuardrails({
      ...base,
      approvalStatus: "PENDING",
      simulateOnly: true,
    });
    expect(g.allowed).toBe(true);
  });
});

describe("operator-budget-prep.service", () => {
  it("computes deterministic scale budget", () => {
    const { proposedBudget, executionAction } = computeProposedBudgetFromRecommendation("SCALE_CAMPAIGN", 100);
    expect(proposedBudget).toBe(115);
    expect(executionAction).toBe("SYNC_CAMPAIGN_BUDGET_INCREASE");
  });

  it("computes pause-prep decrease", () => {
    const { proposedBudget, executionAction } = computeProposedBudgetFromRecommendation("PAUSE_CAMPAIGN", 100);
    expect(proposedBudget).toBe(70);
    expect(executionAction).toBe("SYNC_CAMPAIGN_PAUSE_PREP");
  });
});

describe("meta-budget.adapter", () => {
  beforeEach(() => {
    vi.stubEnv("META_ADS_ACCESS_TOKEN", "");
    vi.stubEnv("FACEBOOK_ADS_ACCESS_TOKEN", "");
  });

  it("simulate returns dry-run success with clear message when mapping valid", async () => {
    const a = createMetaBudgetAdapter();
    const r = await a.simulateBudgetChange({
      campaignId: "c1",
      provider: "META",
      externalCampaignId: "ext1",
      currentBudget: 50,
      proposedBudget: 55,
      currency: "CAD",
      reason: "test",
      executionAction: "SYNC_CAMPAIGN_BUDGET_INCREASE",
    });
    expect(r.dryRun).toBe(true);
    expect(r.success).toBe(true);
    expect(r.message.toLowerCase()).toMatch(/simulation/);
  });

  it("sync does not fake success when API not wired", async () => {
    const a = createMetaBudgetAdapter();
    const r = await a.syncBudgetChange({
      campaignId: "c1",
      provider: "META",
      externalCampaignId: "ext1",
      currentBudget: 50,
      proposedBudget: 55,
      currency: "CAD",
      reason: "test",
    });
    expect(r.success).toBe(false);
  });
});

describe("operator V2 execution brain", () => {
  it("priority scoring orders higher trust above lower when other inputs equal", () => {
    const hi = scoreRecommendation({ trustScore: 0.9, confidenceScore: 0.5, actionType: "SCALE_CAMPAIGN" });
    const lo = scoreRecommendation({ trustScore: 0.3, confidenceScore: 0.5, actionType: "SCALE_CAMPAIGN" });
    expect(hi).toBeGreaterThan(lo);
  });

  it("conflict resolution keeps higher priorityScore", () => {
    const s1: OperatorScoredRecommendation = {
      id: "a",
      source: "ADS",
      actionType: "SCALE_CAMPAIGN",
      entityId: "camp",
      priorityScore: 50,
      trustScore: 0.5,
      reasons: [],
      warnings: [],
      conflictGroup: "campaign:camp:scale_vs_pause",
    };
    const s2: OperatorScoredRecommendation = {
      id: "b",
      source: "ADS",
      actionType: "PAUSE_CAMPAIGN",
      entityId: "camp",
      priorityScore: 40,
      trustScore: 0.5,
      reasons: [],
      warnings: [],
      conflictGroup: "campaign:camp:scale_vs_pause",
    };
    const { kept } = resolveConflicts([s1, s2]);
    expect(kept).toHaveLength(1);
    expect(kept[0]!.id).toBe("a");
  });

  it("execution plan respects batch cap", () => {
    const recs: AssistantRecommendation[] = [];
    const scored: OperatorScoredRecommendation[] = [];
    for (let i = 0; i < 12; i++) {
      const id = `r${i}`;
      recs.push({
        id,
        source: "ADS",
        actionType: "MONITOR",
        targetId: null,
        targetLabel: null,
        title: "t",
        summary: "s",
        reason: "r",
        confidenceScore: 0.6,
        confidenceLabel: "MEDIUM",
        evidenceScore: 0.5,
        evidenceQuality: "MEDIUM",
        createdAt: new Date().toISOString(),
      });
      scored.push({
        id,
        source: "ADS",
        actionType: "MONITOR",
        priorityScore: 100 - i,
        trustScore: 0.7,
        reasons: [],
        warnings: [],
      });
    }
    const plan = buildExecutionPlanFromScored({
      recommendations: recs,
      scored,
      environment: "development",
      resolveConflicts: false,
    });
    expect(plan.ordered.length).toBeLessThanOrEqual(10);
    expect(plan.ordered.length).toBeGreaterThanOrEqual(5);
  });

  it("simulation returns heuristic estimate for empty plan", () => {
    const sim = simulateExecutionPlan({
      totalRecommendations: 0,
      approvedCount: 0,
      blockedCount: 0,
      ordered: [],
      conflicts: [],
      notes: [],
    });
    expect(sim.label).toBe("estimate");
    expect(sim.notes.some((n) => n.toLowerCase().includes("heuristic"))).toBe(true);
  });
});
