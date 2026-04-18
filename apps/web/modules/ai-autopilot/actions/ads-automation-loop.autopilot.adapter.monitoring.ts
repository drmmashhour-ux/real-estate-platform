/**
 * In-memory observability for Ads Autopilot V8 rollout (monitoring only).
 * Does not affect proposal output or execution paths.
 */
let totalRuns = 0;
let legacyPathRuns = 0;
let v8RolloutPathRuns = 0;
let shadowScheduleInvocations = 0;
let shadowPipelineCompletions = 0;
let shadowPipelineFailures = 0;
let shadowPersistenceSuccess = 0;
let shadowPersistenceFailures = 0;

/** Phase D primary path counters (process-local). */
let v8PrimarySuccessCount = 0;
let v8PrimaryFallbackCount = 0;
const recentPrimaryFallbackReasons: string[] = [];
const MAX_REASONS = 12;

/** Last path label for compact admin/debug (process-local). */
let lastPrimaryPathLabel: "v8_primary" | "v8_primary_fallback_legacy" | null = null;

export function resetAdsAutopilotV8MonitoringForTests(): void {
  totalRuns = 0;
  legacyPathRuns = 0;
  v8RolloutPathRuns = 0;
  shadowScheduleInvocations = 0;
  shadowPipelineCompletions = 0;
  shadowPipelineFailures = 0;
  shadowPersistenceSuccess = 0;
  shadowPersistenceFailures = 0;
  v8PrimarySuccessCount = 0;
  v8PrimaryFallbackCount = 0;
  recentPrimaryFallbackReasons.length = 0;
  lastPrimaryPathLabel = null;
}

export function recordAdsAutopilotAdapterRun(path: "legacy" | "v8_rollout"): void {
  totalRuns++;
  if (path === "legacy") legacyPathRuns++;
  else v8RolloutPathRuns++;
}

export function recordShadowScheduleInvocation(): void {
  shadowScheduleInvocations++;
}

export function recordShadowPipelineCompleted(): void {
  shadowPipelineCompletions++;
}

export function recordShadowPipelineFailed(): void {
  shadowPipelineFailures++;
}

export function recordShadowPersistenceSuccess(): void {
  shadowPersistenceSuccess++;
}

export function recordShadowPersistenceFailure(): void {
  shadowPersistenceFailures++;
}

export type AdsAutopilotV8MonitoringSnapshot = {
  totalRuns: number;
  legacyPathRuns: number;
  v8RolloutPathRuns: number;
  shadowScheduleInvocations: number;
  shadowPipelineCompletions: number;
  shadowPipelineFailures: number;
  shadowPersistenceSuccess: number;
  shadowPersistenceFailures: number;
  v8PrimarySuccessCount: number;
  v8PrimaryFallbackCount: number;
  recentPrimaryFallbackReasons: string[];
  lastPrimaryPathLabel: "v8_primary" | "v8_primary_fallback_legacy" | null;
};

export function getAdsAutopilotV8MonitoringSnapshot(): AdsAutopilotV8MonitoringSnapshot {
  return {
    totalRuns,
    legacyPathRuns,
    v8RolloutPathRuns,
    shadowScheduleInvocations,
    shadowPipelineCompletions,
    shadowPipelineFailures,
    shadowPersistenceSuccess,
    shadowPersistenceFailures,
    v8PrimarySuccessCount,
    v8PrimaryFallbackCount,
    recentPrimaryFallbackReasons: [...recentPrimaryFallbackReasons],
    lastPrimaryPathLabel,
  };
}

export function recordV8PrimaryOutcome(outcome: "success" | "fallback", reason?: string): void {
  if (outcome === "success") v8PrimarySuccessCount++;
  else {
    v8PrimaryFallbackCount++;
    if (reason && recentPrimaryFallbackReasons.length < MAX_REASONS) {
      recentPrimaryFallbackReasons.push(reason);
    }
  }
}

export function recordV8PrimaryPathLog(path: "v8_primary" | "v8_primary_fallback_legacy"): void {
  lastPrimaryPathLabel = path;
}
