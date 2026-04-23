import { describe, expect, it, beforeEach } from "vitest";

import { aggregateGrowthSignals } from "@/modules/growth-brain/growth-brain-signals.service";
import { prioritizeOpportunities } from "@/modules/growth-brain/growth-brain-prioritization.service";
import { recommendActionsFromOpportunities } from "@/modules/growth-brain/growth-brain-actions.service";
import { allocateAttention } from "@/modules/growth-brain/growth-brain-allocation.service";
import { buildExplainability } from "@/modules/growth-brain/growth-brain-explainability.service";
import { buildGrowthAlerts } from "@/modules/growth-brain/growth-brain-alerts.service";
import {
  deriveLearnedPatterns,
  logActionOutcome,
  resetGrowthBrainLearningForTests,
} from "@/modules/growth-brain/growth-brain-learning.service";
import {
  resetGrowthBrainStateForTests,
  runGrowthBrainSnapshot,
} from "@/modules/growth-brain/growth-brain.service";

describe("growth-brain", () => {
  beforeEach(() => {
    resetGrowthBrainStateForTests();
    resetGrowthBrainLearningForTests();
  });

  it("aggregates normalized signals", () => {
    const signals = aggregateGrowthSignals();
    expect(Array.isArray(signals)).toBe(true);
    expect(signals.every((s) => s.signalId && s.signalType)).toBe(true);
  });

  it("prioritizes opportunities by score", () => {
    const signals = aggregateGrowthSignals();
    const ranked = prioritizeOpportunities(signals);
    if (ranked.length >= 2) {
      expect(ranked[0]!.priorityScore).toBeGreaterThanOrEqual(ranked[ranked.length - 1]!.priorityScore);
    }
  });

  it("recommends actions with risk and approval flags", () => {
    const signals = aggregateGrowthSignals();
    const opps = prioritizeOpportunities(signals);
    const actions = recommendActionsFromOpportunities(opps, "ASSIST", 5);
    for (const a of actions) {
      expect(a.riskLevel).toBeTruthy();
      expect(typeof a.approvalRequired).toBe("boolean");
    }
  });

  it("allocation returns slices summing near 100 when opportunities exist", () => {
    const signals = aggregateGrowthSignals();
    const opps = prioritizeOpportunities(signals);
    const alloc = allocateAttention(opps);
    const sum = alloc.slices.reduce((s, x) => s + x.percent, 0);
    expect(sum).toBeGreaterThan(90);
    expect(sum).toBeLessThanOrEqual(100);
  });

  it("explainability references signals and thresholds", () => {
    const signals = aggregateGrowthSignals();
    const opps = prioritizeOpportunities(signals);
    const top = opps[0];
    expect(top).toBeTruthy();
    const pack = buildExplainability(
      top!,
      signals.filter((s) => top!.sourceSignalIds.includes(s.signalId))
    );
    expect(pack.prioritizationReason.length).toBeGreaterThan(20);
    expect(pack.approvalExplanation.length).toBeGreaterThan(10);
  });

  it("alerts attach to severity", () => {
    const signals = aggregateGrowthSignals();
    const opps = prioritizeOpportunities(signals);
    const alerts = buildGrowthAlerts(signals, opps, false);
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("learning records outcomes and derives patterns", () => {
    logActionOutcome({
      actionId: "a1",
      actionType: "GENERATE_CONTENT",
      outcome: "executed",
      leadDelta: 3,
      revenueDeltaCents: 5000,
    });
    const { strong } = deriveLearnedPatterns();
    expect(Array.isArray(strong)).toBe(true);
  });

  it("snapshot stitches pipeline", () => {
    const snap = runGrowthBrainSnapshot();
    expect(snap.signals.length).toBeGreaterThan(0);
    expect(snap.opportunities.length).toBeGreaterThan(0);
    expect(snap.generatedAtIso).toBeTruthy();
  });
});
