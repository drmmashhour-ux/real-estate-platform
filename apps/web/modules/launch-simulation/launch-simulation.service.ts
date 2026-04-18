import type { LaunchSimulationAssumptions, LaunchSimulationScenario, ThreeMonthProjection } from "./launch-simulation.types";
import { getDefaultAssumptionsForScenario } from "./scenario-assumptions.service";
import { validateLaunchSimulationAssumptions } from "./assumptions-validator.service";
import { runRevenueScenarioCalculator } from "./revenue-scenario-calculator.service";
import { buildFounderMetricsSummary } from "./founder-metrics-summary.service";

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Partial<T>): T {
  const out = { ...base } as T;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    const cur = out[k as keyof T];
    if (v && typeof v === "object" && !Array.isArray(v) && cur && typeof cur === "object" && !Array.isArray(cur)) {
      (out as Record<string, unknown>)[k] = deepMerge(cur as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

export function mergeAssumptionPatch(
  scenario: LaunchSimulationScenario,
  patch: Partial<LaunchSimulationAssumptions> | null | undefined
): LaunchSimulationAssumptions {
  const base = getDefaultAssumptionsForScenario(scenario);
  if (!patch) return base;
  const merged = deepMerge(base as unknown as Record<string, unknown>, patch as Record<string, unknown>);
  merged.scenario = scenario;
  const v = validateLaunchSimulationAssumptions(merged);
  if (!v.ok) return base;
  return v.value;
}

export function runLaunchSimulation(assumptions: LaunchSimulationAssumptions): {
  projection: ThreeMonthProjection;
  summary: ReturnType<typeof buildFounderMetricsSummary>;
} {
  const projection = runRevenueScenarioCalculator(assumptions);
  const summary = buildFounderMetricsSummary(assumptions, projection);
  return { projection, summary };
}

export function runScenarioWithOptionalPatch(
  scenario: LaunchSimulationScenario,
  patch?: Partial<LaunchSimulationAssumptions> | null
) {
  const a = mergeAssumptionPatch(scenario, patch);
  return runLaunchSimulation(a);
}
