import type { LaunchSimulationAssumptions } from "./launch-simulation.types";
import { buildThreeMonthProjection } from "./projection-summary.service";

export function runRevenueScenarioCalculator(assumptions: LaunchSimulationAssumptions) {
  return buildThreeMonthProjection(assumptions);
}
