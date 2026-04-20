import { runUnderwriting } from "@/modules/investment/underwriting.service";
import type { ScenarioInput, UnderwritingInput } from "@/modules/investment/underwriting.types";

export function runScenario(base: UnderwritingInput, scenario: ScenarioInput) {
  const modified: UnderwritingInput = {
    ...base,
    occupancyRate: Math.min(1, Math.max(0, base.occupancyRate + (scenario.occupancyDelta ?? 0))),
    adr: Math.max(0, base.adr + (scenario.adrDelta ?? 0)),
    monthlyCost: Math.max(0, base.monthlyCost + (scenario.costDelta ?? 0)),
  };

  return runUnderwriting(modified);
}
