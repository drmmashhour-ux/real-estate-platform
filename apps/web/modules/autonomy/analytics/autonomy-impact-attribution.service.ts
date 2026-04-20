import type { OutcomeEvent } from "../types/autonomy.types";

export function buildAutonomyImpactSummary(events: OutcomeEvent[]) {
  const revenueDelta = events
    .filter((e) => e.metric === "revenue_delta")
    .reduce((sum, e) => sum + (e.delta ?? 0), 0);

  const occupancyDelta = events
    .filter((e) => e.metric === "occupancy_delta")
    .reduce((sum, e) => sum + (e.delta ?? 0), 0);

  const riskReduction = events
    .filter((e) => e.metric === "risk_reduction")
    .reduce((sum, e) => sum + (e.delta ?? 0), 0);

  return {
    revenueDelta,
    occupancyDelta,
    riskReduction,
    totalEvents: events.length,
  };
}
