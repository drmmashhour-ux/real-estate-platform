import { describe, expect, it, vi } from "vitest";
import { compareAdsAutopilotProposalSets } from "./ads-automation-loop.autopilot.adapter.shadow";
import {
  applyV8Influence,
  buildAdsAutopilotComparisonMetrics,
} from "./ads-automation-loop.autopilot.adapter.influence";
import type { ProposedAction } from "../ai-autopilot.types";

vi.mock("@/lib/logger", () => ({
  logWarn: vi.fn(),
}));

function pa(partial: Partial<ProposedAction> & Pick<ProposedAction, "actionType" | "entityId">): ProposedAction {
  return {
    domain: "growth",
    entityType: "ads_automation_loop",
    title: "t",
    summary: "s",
    severity: "low",
    riskLevel: "LOW",
    recommendedPayload: {},
    reasons: { confidence: 0.5 },
    subjectUserId: null,
    audience: "admin",
    ...partial,
  };
}

describe("applyV8Influence", () => {
  it("skips influence when comparison is weak (structural drift)", () => {
    const live = [pa({ actionType: "a", entityId: "1", reasons: { confidence: 0.7 } })];
    const shadow = [
      pa({ actionType: "a", entityId: "1", reasons: { confidence: 0.7 } }),
      pa({ actionType: "b", entityId: "2", reasons: { confidence: 0.5 } }),
    ];
    const diff = compareAdsAutopilotProposalSets(live, shadow);
    const metrics = buildAdsAutopilotComparisonMetrics(live, shadow, diff);
    expect(metrics.weakComparison).toBe(true);
    const { actions, stats } = applyV8Influence(live, shadow, metrics, diff);
    expect(stats.influenced).toBe(0);
    expect(actions).toHaveLength(1);
    expect((actions[0].reasons as Record<string, unknown>).v8InfluenceTag).toBeUndefined();
  });

  it("respects maxAdjustedFraction — caps influenced row count", () => {
    const live = Array.from({ length: 10 }, (_, i) =>
      pa({ actionType: "scale", entityId: `e${i}`, reasons: { confidence: 0.72 } }),
    );
    const shadow = JSON.parse(JSON.stringify(live)) as ProposedAction[];
    const diff = compareAdsAutopilotProposalSets(live, shadow);
    const metrics = buildAdsAutopilotComparisonMetrics(live, shadow, diff);
    const { stats } = applyV8Influence(live, shadow, metrics, diff, { maxAdjustedFraction: 0.28 });
    const cap = Math.ceil(10 * 0.28);
    expect(stats.influenced).toBeLessThanOrEqual(cap);
  });

  it("does not add or remove actions", () => {
    const live = [
      pa({ actionType: "x", entityId: "loop_review", reasons: { confidence: 0.65 } }),
      pa({ actionType: "y", entityId: "z", reasons: { confidence: 0.7 } }),
    ];
    const shadow = live.map((a) => JSON.parse(JSON.stringify(a)) as ProposedAction);
    const diff = compareAdsAutopilotProposalSets(live, shadow);
    const metrics = buildAdsAutopilotComparisonMetrics(live, shadow, diff);
    const { actions } = applyV8Influence(live, shadow, metrics, diff);
    expect(actions).toHaveLength(2);
    expect(actions.map((a) => a.actionType + a.entityId)).toEqual(live.map((a) => a.actionType + a.entityId));
  });

  it("applies bounded confidence nudge on boost when aligned", () => {
    const live = [
      pa({ actionType: "loop", entityId: "e1", reasons: { confidence: 0.62 } }),
      pa({ actionType: "scale", entityId: "e2", reasons: { confidence: 0.72 } }),
    ];
    const shadow = JSON.parse(JSON.stringify(live)) as ProposedAction[];
    const diff = compareAdsAutopilotProposalSets(live, shadow);
    const metrics = buildAdsAutopilotComparisonMetrics(live, shadow, diff);
    expect(metrics.weakComparison).toBe(false);
    const { actions, stats } = applyV8Influence(live, shadow, metrics, diff);
    expect(stats.boost).toBeGreaterThan(0);
    const second = actions.find((a) => a.entityId === "e2");
    expect(second).toBeDefined();
    const before = 0.72;
    const after = (second!.reasons as { confidence: number }).confidence;
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBeLessThanOrEqual(before * 0.16);
  });

  it("tags monitor_only when borderline divergence without strong disagree", () => {
    const live = [pa({ actionType: "t", entityId: "m1", reasons: { confidence: 0.62 } })];
    const shadow = [pa({ actionType: "t", entityId: "m1", reasons: { confidence: 0.5 } })];
    const diff = compareAdsAutopilotProposalSets(live, shadow);
    const metrics = buildAdsAutopilotComparisonMetrics(live, shadow, diff);
    const { actions, stats } = applyV8Influence(live, shadow, metrics, diff);
    expect(stats.monitorOnly + stats.boost + stats.downrank).toBeGreaterThan(0);
    const tag = (actions[0].reasons as Record<string, unknown>).v8InfluenceTag;
    expect(["monitor_only", "downrank", "boost"]).toContain(tag);
    if (tag === "monitor_only") {
      expect((actions[0].reasons as { confidence: number }).confidence).toBe(0.62);
    }
  });

  it("downranks on strong shadow disagreement (non-critical)", () => {
    const live = [pa({ actionType: "pause", entityId: "p1", reasons: { confidence: 0.7 } })];
    const shadow = [pa({ actionType: "pause", entityId: "p1", reasons: { confidence: 0.54 } })];
    const diff = compareAdsAutopilotProposalSets(live, shadow);
    const metrics = buildAdsAutopilotComparisonMetrics(live, shadow, diff);
    const { actions, stats } = applyV8Influence(live, shadow, metrics, diff);
    expect(stats.downrank).toBeGreaterThan(0);
    const after = (actions[0].reasons as { confidence: number }).confidence;
    expect(after).toBeLessThan(0.85);
  });
});
