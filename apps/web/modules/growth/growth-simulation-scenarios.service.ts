/**
 * Default what-if scenarios — conservative assumptions; no guarantees.
 */

import { growthSimulationFlags } from "@/config/feature-flags";
import type { GrowthSimulationScenarioInput } from "./growth-simulation.types";

export function buildGrowthSimulationScenarios(): GrowthSimulationScenarioInput[] {
  if (!growthSimulationFlags.growthSimulationScenariosV1) {
    return [];
  }

  return [
    {
      id: "sim-acq",
      type: "increase_acquisition",
      title: "Increase acquisition",
      assumptions: [
        "Modest increase in qualified traffic or campaign reach (bounded).",
        "No change to pricing or checkout flows in this simulation.",
      ],
      targetChange: { trafficPct: 12 },
    },
    {
      id: "sim-cvr",
      type: "fix_conversion",
      title: "Fix conversion first",
      assumptions: [
        "Landing and form paths improve before spend scales.",
        "Estimates assume incremental form completion, not guaranteed lift.",
      ],
      targetChange: { conversionPct: 10 },
    },
    {
      id: "sim-fu",
      type: "improve_followup",
      title: "Improve follow-up",
      assumptions: [
        "Faster internal response to high-intent and due items (human-led).",
        "No automated outbound sends implied.",
      ],
      targetChange: { followUpPct: 15 },
    },
    {
      id: "sim-content",
      type: "improve_content",
      title: "Improve content quality",
      assumptions: [
        "Clearer ad and listing copy; iterative creative improvements only.",
        "No channel algorithm changes modeled here.",
      ],
      targetChange: { contentQualityPct: 8 },
    },
    {
      id: "sim-mixed",
      type: "mixed_strategy",
      title: "Mixed strategy",
      assumptions: [
        "Small coordinated gains across acquisition, follow-up, and conversion.",
        "Execution complexity increases — conservative upside caps apply.",
      ],
      targetChange: {
        trafficPct: 6,
        conversionPct: 5,
        followUpPct: 8,
        contentQualityPct: 4,
      },
    },
  ];
}
