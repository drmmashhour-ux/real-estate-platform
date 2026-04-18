export type {
  SimulationDomain,
  SimulationRunContext,
  SimulationScenarioResult,
  SimulationStatus,
  SimulationStepResult,
  UnifiedPlatformSimulationReport,
} from "./e2e-simulation.types";
export { runFullPlatformSimulation, type RunFullPlatformSimulationOptions } from "./e2e-simulation.service";
export { runOrderedPlatformSimulations } from "./simulation-runner.service";
export { writeUnifiedSimulationReports, resolveE2eReportJsonPath } from "./simulation-report.service";
export { computeLaunchDecision } from "./launch-decision.service";
export { peekBrowserPlaywrightMeta } from "./playwright-browser.service";
