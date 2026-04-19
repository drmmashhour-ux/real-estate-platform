import { describe, expect, it } from "vitest";
import { generateAdaptiveDecisions } from "@/modules/growth/adaptive-decision.service";
import { attachAdaptiveExplanations } from "@/modules/growth/adaptive-explainer.service";
import type { AdaptiveContext, AdaptiveDecision } from "@/modules/growth/adaptive-intelligence.types";
import { prioritizeAdaptiveDecisions } from "@/modules/growth/adaptive-priority.service";

function baseCtx(over: Partial<AdaptiveContext> = {}): AdaptiveContext {
  return {
    generatedAt: "2026-01-01T00:00:00.000Z",
    brokerDependencySignals: [],
    pipelineStatus: "0 leads in 14d",
    executionStatus: "planner off",
    sparseSignals: true,
    ...over,
  };
}

describe("generateAdaptiveDecisions", () => {
  it("returns no decisions when signals are empty and not critical timing", () => {
    const d = generateAdaptiveDecisions(
      baseCtx({ timingUrgencyHint: "standard", sparseSignals: true }),
    );
    expect(d.length).toBe(0);
  });

  it("emits timing decision when critical window is active", () => {
    const d = generateAdaptiveDecisions(
      baseCtx({
        timingUrgencyHint: "critical",
        bestTimingWindow: "reply within 1–5 minutes (urgency: critical)",
        sparseSignals: false,
        pipelineStatus: "enough rows",
      }),
    );
    expect(d.some((x) => x.category === "timing")).toBe(true);
  });

  it("emits closing decision for high score and stale touch", () => {
    const d = generateAdaptiveDecisions(
      baseCtx({
        topLead: { score: 80, pipelineStage: "qualified", hoursSinceTouch: 50 },
        sparseSignals: false,
        revenueSignalSummary: "ok",
      }),
    );
    expect(d.some((x) => x.category === "closing")).toBe(true);
  });

  it("every decision requires approval", () => {
    const d = generateAdaptiveDecisions(
      baseCtx({
        timingUrgencyHint: "critical",
        bestTimingWindow: "x",
        topLead: { score: 90, pipelineStage: "meeting", hoursSinceTouch: 10 },
        sparseSignals: false,
        revenueSignalSummary: "r",
      }),
    );
    for (const x of d) {
      expect(x.requiresApproval).toBe(true);
    }
  });
});

describe("prioritizeAdaptiveDecisions", () => {
  it("orders timing critical before growth medium when scores favor timing", () => {
    const a: AdaptiveDecision = {
      id: "a",
      category: "growth",
      priority: "medium",
      action: "G",
      reason: "r",
      supportingSignals: [],
      confidence: "medium",
      requiresApproval: true,
      whyItMatters: "w",
    };
    const b: AdaptiveDecision = {
      id: "b",
      category: "timing",
      priority: "critical",
      action: "T",
      reason: "r2",
      supportingSignals: [],
      confidence: "high",
      requiresApproval: true,
      whyItMatters: "w2",
    };
    const ordered = prioritizeAdaptiveDecisions([a, b]);
    expect(ordered[0].category).toBe("timing");
  });
});

describe("attachAdaptiveExplanations", () => {
  it("fills whyItMatters for each category", () => {
    const d: AdaptiveDecision = {
      id: "x",
      category: "closing",
      priority: "high",
      action: "act",
      reason: "r",
      supportingSignals: ["s"],
      confidence: "medium",
      requiresApproval: true,
      whyItMatters: "tmp",
    };
    const [out] = attachAdaptiveExplanations([d]);
    expect(out.whyItMatters.length).toBeGreaterThan(20);
    expect(out.whyItMatters).toMatch(/correlat|pipeline|conservative/i);
  });
});
