/**
 * Multi-scenario comparison using synchronous score-threshold simulation only.
 */
import type {
  PolicySimulationCase,
  PolicySimulationComparisonReport,
  PolicySimulationConfig,
} from "./policy-simulation.types";
import { runPolicySimulation } from "./policy-simulation.engine";

/** Lower is better: leaked exposure minus FP rate penalty (advisory composite). */
function scenarioScore(r: { leakedRevenue: number; falsePositiveRate: number }): number {
  return r.leakedRevenue - r.falsePositiveRate;
}

export function comparePolicyScenarios(
  cases: PolicySimulationCase[],
  baselineConfig: PolicySimulationConfig,
  scenarioConfigs: PolicySimulationConfig[],
): PolicySimulationComparisonReport {
  const baseline = runPolicySimulation(cases, baselineConfig);

  const scenarios = scenarioConfigs.map((config) => runPolicySimulation(cases, config, baseline));

  const ranked = [...scenarios].sort((a, b) => scenarioScore(a) - scenarioScore(b));
  const best = ranked[0];

  return {
    baseline,
    scenarios,
    bestScenarioId: best?.configId,
  };
}
