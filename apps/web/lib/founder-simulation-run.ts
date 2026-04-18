import type { StoredAssumptionOverrides } from "@/lib/founder-simulation-state.service";
import { runScenarioWithOptionalPatch } from "@/modules/launch-simulation/launch-simulation.service";
import { buildFounderMetricsSummary } from "@/modules/launch-simulation/founder-metrics-summary.service";
import type { LaunchSimulationScenario, ThreeMonthProjection } from "@/modules/launch-simulation/launch-simulation.types";

export type ScenarioTriplet<T> = {
  conservative: T;
  baseline: T;
  optimistic: T;
};

export type FounderMetricsSummaryRow = ReturnType<typeof buildFounderMetricsSummary>;

export function runStoredSimulationTriplet(overrides: StoredAssumptionOverrides): {
  projections: ScenarioTriplet<ThreeMonthProjection>;
  summaries: ScenarioTriplet<FounderMetricsSummaryRow>;
} {
  const scenarios: LaunchSimulationScenario[] = ["conservative", "baseline", "optimistic"];
  const projections = {} as ScenarioTriplet<ThreeMonthProjection>;
  const summaries = {} as ScenarioTriplet<FounderMetricsSummaryRow>;
  for (const s of scenarios) {
    const r = runScenarioWithOptionalPatch(s, overrides[s]);
    projections[s] = r.projection;
    summaries[s] = r.summary;
  }
  return { projections, summaries };
}
