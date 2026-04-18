import type { SimulationScenarioResult, SimulationStepResult } from "./e2e-simulation.types";

type LogEntry = { ts: string; level: "info" | "warn" | "error"; message: string; meta?: Record<string, unknown> };

const buffer: LogEntry[] = [];

export function simulationLog(
  level: LogEntry["level"],
  message: string,
  meta?: Record<string, unknown>
): void {
  buffer.push({ ts: new Date().toISOString(), level, message, meta });
  const line = `[e2e-sim] ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function flushSimulationLogs(): LogEntry[] {
  return [...buffer];
}

export function clearSimulationLogs(): void {
  buffer.length = 0;
}

export function summarizeScenario(scenario: SimulationScenarioResult): string {
  const failed = scenario.steps.filter((s) => s.status === "FAIL").length;
  const nc = scenario.steps.filter((s) => s.status === "NOT_CONFIRMED").length;
  return `${scenario.scenarioName}: ${scenario.status} (${scenario.steps.length} steps, ${failed} fail, ${nc} not confirmed)`;
}

export function stepFail(
  stepId: string,
  title: string,
  routeOrService: string,
  details: string,
  evidence: string,
  blockers: string[] = []
): SimulationStepResult {
  return {
    stepId,
    title,
    status: "FAIL",
    details,
    routeOrService,
    evidence,
    frictionPoints: [],
    blockers,
  };
}

export function stepPass(
  stepId: string,
  title: string,
  routeOrService: string,
  details: string,
  evidence: string,
  frictionPoints: string[] = []
): SimulationStepResult {
  return {
    stepId,
    title,
    status: "PASS",
    details,
    routeOrService,
    evidence,
    frictionPoints,
    blockers: [],
  };
}

export function stepWarn(
  stepId: string,
  title: string,
  routeOrService: string,
  details: string,
  evidence: string,
  frictionPoints: string[] = []
): SimulationStepResult {
  return {
    stepId,
    title,
    status: "WARNING",
    details,
    routeOrService,
    evidence,
    frictionPoints,
    blockers: [],
  };
}

export function stepNotConfirmed(
  stepId: string,
  title: string,
  routeOrService: string,
  details: string,
  evidence: string,
  frictionPoints: string[] = []
): SimulationStepResult {
  return {
    stepId,
    title,
    status: "NOT_CONFIRMED",
    details,
    routeOrService,
    evidence,
    frictionPoints,
    blockers: [],
  };
}
