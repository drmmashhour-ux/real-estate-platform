import type { LaunchSimulationAssumptions } from "./launch-simulation.types";
import type { ThreeMonthProjection } from "./launch-simulation.types";
import { buildUnitEconomics } from "./unit-economics.service";

export function buildFounderMetricsSummary(a: LaunchSimulationAssumptions, p: ThreeMonthProjection) {
  const ue = buildUnitEconomics(a, p);
  return {
    generatedAt: new Date().toISOString(),
    scenario: a.scenario,
    projection: p,
    unitEconomics: ue,
    activation: {
      activationRateFromOutreach: a.activationRateFromOutreach,
      hostToFirstBookingConversion: a.hostToFirstBookingConversion,
      brokerToPaidConversion: a.brokerToPaidConversion,
    },
  };
}
