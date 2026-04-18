import type { SimulationScenarioResult, SimulationStatus, SimulationStepResult } from "./e2e-simulation.types";

/**
 * Roll up step statuses → scenario status.
 * FAIL if any step FAIL. NOT_CONFIRMED if any NOT_CONFIRMED and no FAIL. WARNING if any WARNING and no fail/nc.
 */
export function scenarioStatusFromSteps(steps: SimulationStepResult[]): SimulationStatus {
  if (steps.some((s) => s.status === "FAIL")) return "FAIL";
  if (steps.some((s) => s.status === "NOT_CONFIRMED")) return "NOT_CONFIRMED";
  if (steps.some((s) => s.status === "WARNING")) return "WARNING";
  return "PASS";
}

export function aggregateFriction(steps: SimulationStepResult[]): string[] {
  const out: string[] = [];
  for (const s of steps) {
    out.push(...s.frictionPoints);
  }
  return [...new Set(out)];
}

export function aggregateBlockers(steps: SimulationStepResult[]): string[] {
  const out: string[] = [];
  for (const s of steps) {
    out.push(...s.blockers);
  }
  return [...new Set(out)];
}

export function scenarioRollup(scenario: Omit<SimulationScenarioResult, "status" | "summary">): SimulationScenarioResult {
  const status = scenarioStatusFromSteps(scenario.steps);
  const summary = `${scenario.scenarioName}: ${status} (${scenario.steps.length} steps)`;
  return { ...scenario, status, summary };
}
