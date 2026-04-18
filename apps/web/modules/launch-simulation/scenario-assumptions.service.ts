import type { LaunchSimulationAssumptions, LaunchSimulationScenario } from "./launch-simulation.types";
import { buildMontrealAssumptions } from "./montreal-assumptions.service";

export function getDefaultAssumptionsForScenario(scenario: LaunchSimulationScenario): LaunchSimulationAssumptions {
  return buildMontrealAssumptions(scenario);
}
