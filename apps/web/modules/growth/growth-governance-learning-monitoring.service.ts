/**
 * Control-plane observability for governance + learning — never throws.
 */

import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";

export type GrowthGovernanceLearningMonitoringSnapshot = {
  controlEvaluations: number;
  normalCount: number;
  monitorCount: number;
  freezeCount: number;
  resetCount: number;
  warningsCount: number;
};

const snap: GrowthGovernanceLearningMonitoringSnapshot = {
  controlEvaluations: 0,
  normalCount: 0,
  monitorCount: 0,
  freezeCount: 0,
  resetCount: 0,
  warningsCount: 0,
};

export function getGrowthGovernanceLearningMonitoringSnapshot(): GrowthGovernanceLearningMonitoringSnapshot {
  return { ...snap };
}

export function resetGrowthGovernanceLearningMonitoringForTests(): void {
  snap.controlEvaluations = 0;
  snap.normalCount = 0;
  snap.monitorCount = 0;
  snap.freezeCount = 0;
  snap.resetCount = 0;
  snap.warningsCount = 0;
}

function bumpState(s: GrowthLearningControlDecision["state"]): void {
  if (s === "normal") snap.normalCount += 1;
  else if (s === "monitor") snap.monitorCount += 1;
  else if (s === "freeze_recommended") snap.freezeCount += 1;
  else snap.resetCount += 1;
}

export function recordGrowthLearningControlEvaluation(decision: GrowthLearningControlDecision): void {
  try {
    snap.controlEvaluations += 1;
    bumpState(decision.state);
    snap.warningsCount += decision.state === "monitor" ? 1 : 0;

    console.log(
      JSON.stringify({
        tag: "[growth:governance:learning]",
        state: decision.state,
        confidence: decision.confidence,
        signals: decision.observedSignals,
        reasons: decision.reasons.slice(0, 6).map((r) => r.code),
      }),
    );
  } catch {
    /* never throw */
  }
}
