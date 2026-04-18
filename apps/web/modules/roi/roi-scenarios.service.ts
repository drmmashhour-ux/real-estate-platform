import { OPTIMIZATION_SCENARIOS, type OptimizationScenarioKey } from "./assumptions.constants";
import type { RoiCalculatorInput } from "./roi-calculator.types";
import { buildRoiComparison } from "./roi-calculator.service";

export function buildRoiForScenario(
  base: Omit<RoiCalculatorInput, "estimatedOptimizationGainPercent">,
  scenario: OptimizationScenarioKey,
) {
  const gain = OPTIMIZATION_SCENARIOS[scenario].gainPercent;
  return buildRoiComparison({
    ...base,
    estimatedOptimizationGainPercent: gain,
  });
}
