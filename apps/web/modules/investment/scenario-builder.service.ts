import { runScenario } from "@/modules/investment/scenario.service";
import type { ScenarioPack, UnderwritingInput } from "@/modules/investment/underwriting.types";

export function buildScenarios(base: UnderwritingInput): ScenarioPack {
  return {
    baseline: {
      label: "Baseline (your inputs)",
      description: "No deltas applied.",
      deltas: {},
      result: runScenario(base, {}),
    },
    optimistic: {
      label: "Optimistic",
      description: "+10 pts occupancy (absolute), +20 ADR (same currency units as ADR input).",
      deltas: { occupancyDelta: 0.1, adrDelta: 20 },
      result: runScenario(base, {
        occupancyDelta: 0.1,
        adrDelta: 20,
      }),
    },
    pessimistic: {
      label: "Pessimistic",
      description: "−10 pts occupancy (absolute), −20 ADR.",
      deltas: { occupancyDelta: -0.1, adrDelta: -20 },
      result: runScenario(base, {
        occupancyDelta: -0.1,
        adrDelta: -20,
      }),
    },
    stress: {
      label: "Stress",
      description: "−20 pts occupancy (absolute), +300 monthly operating cost.",
      deltas: { occupancyDelta: -0.2, costDelta: 300 },
      result: runScenario(base, {
        occupancyDelta: -0.2,
        costDelta: 300,
      }),
    },
  };
}
