/**
 * LECIPM FINAL PRE-LAUNCH VALIDATION v1 — aggregate report shape.
 */
import type { PlatformValidationReportV1 } from "@/modules/validation/types";
import type { UnifiedPlatformSimulationReport } from "@/modules/e2e-simulation/e2e-simulation.types";

export type CheckSeverity = "blocking" | "warning" | "info";

export type EnvCheckItem = {
  id: string;
  ok: boolean;
  severity: CheckSeverity;
  detail: string;
  evidence?: Record<string, unknown>;
};

export type BuildStepResult = {
  step: string;
  ok: boolean;
  durationMs: number;
  /** stderr+stdout tail when failed */
  logTail?: string;
  severity: CheckSeverity;
};

export type GrowthApiProbe = {
  name: string;
  method: string;
  path: string;
  httpStatus?: number;
  ok: boolean;
  /** What we verified */
  expectation: string;
  detail: string;
};

export type PerformanceThresholdResult = {
  homepageLoadMs?: number;
  apiReadyMs?: number;
  homepageWarn?: string;
  apiReadyWarn?: string;
};

export type FeatureFlagRolloutItem = {
  order: number;
  envKey: string;
  description: string;
  /** Current effective state from process.env at report time */
  rawEnv?: string;
  /** true / false / unknown */
  interpreted: string;
  note: string;
};

export type FinalLaunchReportV1 = {
  version: "lecipm-final-prelaunch-validation-v1";
  generatedAt: string;
  environment: EnvCheckItem[];
  build: {
    steps: BuildStepResult[];
    blockingFailures: string[];
  };
  platformValidation: PlatformValidationReportV1 | null;
  simulation: UnifiedPlatformSimulationReport | null;
  growthApis: GrowthApiProbe[];
  performance: PerformanceThresholdResult;
  featureFlagRolloutPlan: FeatureFlagRolloutItem[];
  dashboardUrlsProbed: { path: string; status: string; httpStatus?: number; detail?: string }[];
  decision: "GO" | "GO_WITH_WARNINGS" | "NO_GO";
  blockers: string[];
  warnings: string[];
  evidenceNote: string;
};
