/**
 * LECIPM Full Platform End-to-End Simulation v1 — shared result shapes.
 * Status values are honest: NOT_CONFIRMED when a live step was not executed.
 */

export type SimulationStatus = "PASS" | "FAIL" | "WARNING" | "NOT_CONFIRMED";

export type SimulationStepResult = {
  stepId: string;
  title: string;
  status: SimulationStatus;
  details: string;
  routeOrService: string;
  evidence: string;
  frictionPoints: string[];
  blockers: string[];
};

export type SimulationScenarioResult = {
  scenarioId: string;
  scenarioName: string;
  domain: SimulationDomain;
  status: SimulationStatus;
  steps: SimulationStepResult[];
  summary: string;
  recommendations: string[];
};

export type SimulationDomain =
  | "bnhub_guest"
  | "bnhub_host"
  | "broker"
  | "admin"
  | "founder"
  | "mobile_broker"
  | "ai_systems"
  | "payments"
  | "failure_edge"
  | "browser_e2e";

export type SimulationRunContext = {
  /** e.g. http://127.0.0.1:3001 */
  baseUrl: string;
  locale: string;
  country: string;
  /** When true, runs real Stripe test-mode booking E2E (requires sk_test, whsec, Next + DB). */
  executeLiveStripeBooking: boolean;
  /** When true, mobile scenario attempts extra checks (still mostly NOT_CONFIRMED without device). */
  executeMobileDeepChecks: boolean;
  generatedAt: string;
};

/** Attached when Playwright browser suite runs (see `playwright-browser.service.ts`). */
export type BrowserPlaywrightReportMeta = {
  exitCode: number;
  reportJsonPath: string;
  unexpected: number;
  expected: number;
  skipped: number;
  failedTitles: string[];
  stderrTail: string;
};

export type UnifiedPlatformSimulationReport = {
  version: "LECIPM Full Platform End-to-End Simulation v1" | "LECIPM Full Browser E2E Validation v1";
  generatedAt: string;
  context: Omit<SimulationRunContext, "generatedAt">;
  scenarios: SimulationScenarioResult[];
  criticalBlockers: string[];
  warnings: string[];
  recommendedFixesPriority: string[];
  decision: "GO" | "GO_WITH_WARNINGS" | "NO_GO";
  /** Last Chromium E2E run metadata (honest; null if skipped). */
  browserPlaywright?: BrowserPlaywrightReportMeta | null;
};
