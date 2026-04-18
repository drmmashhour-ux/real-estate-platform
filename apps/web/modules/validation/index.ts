/**
 * LECIPM Full Platform Validation System v1 — public API surface for scripts and tooling.
 */
export * from "./types";
export { discoverAllRoutes, summarizeRoutesByCategory, pathTemplateToExample, getDynamicRouteSamples } from "./route-discovery.service";
export { validatePage, percentileMs } from "./page-validator.service";
export { runApiProbe, defaultApiProbes } from "./api-validator.service";
export type { ApiProbe } from "./api-validator.service";
export { runSecurityProbes } from "./security-validation.service";
export { decideLaunch } from "./launch-decision.service";
export { runLaunchEventsGate } from "./launch-events-gate.service";
export { writeValidationReports, getReportsDir } from "./report-writer.service";
export { executePlatformValidationV1 } from "./platform-validation-runner.service";
export type { RunPlatformValidationV1Options } from "./platform-validation-runner.service";
