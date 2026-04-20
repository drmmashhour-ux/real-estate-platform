import type { LearningSnapshot, OutcomeEvent } from "../types/autonomy.types";

/** Deterministic aggregation — outcome-based self-improving engine (rules + counters, not ML claims). */
export function buildLearningSnapshot(events: OutcomeEvent[]): LearningSnapshot {
  const positive = events.filter((e) => e.label === "POSITIVE").length;
  const negative = events.filter((e) => e.label === "NEGATIVE").length;
  const total = events.length;

  const revenueEvents = events.filter((e) => e.metric === "revenue_delta");
  const occupancyEvents = events.filter((e) => e.metric === "occupancy_delta");
  const riskEvents = events.filter((e) => e.metric === "risk_reduction");

  const avg = (nums: number[]) =>
    nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

  return {
    modelVersion: "autonomy-learning-v1",
    totalActions: total,
    positiveOutcomes: positive,
    negativeOutcomes: negative,
    successRate: total ? positive / total : 0,
    averageRevenueDelta: avg(revenueEvents.map((e) => e.delta ?? 0)),
    averageOccupancyDelta: avg(occupancyEvents.map((e) => e.delta ?? 0)),
    averageRiskReduction: avg(riskEvents.map((e) => e.delta ?? 0)),
    updatedAt: new Date().toISOString(),
  };
}
