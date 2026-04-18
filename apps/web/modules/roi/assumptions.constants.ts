/** Scenario labels only — not predictions. */
export const OPTIMIZATION_SCENARIOS = {
  conservative: { label: "Conservative", gainPercent: 0.1 },
  standard: { label: "Standard", gainPercent: 0.2 },
  aggressive: { label: "Aggressive", gainPercent: 0.3 },
} as const;

export type OptimizationScenarioKey = keyof typeof OPTIMIZATION_SCENARIOS;
