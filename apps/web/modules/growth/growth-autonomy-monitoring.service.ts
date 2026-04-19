/**
 * Autonomy rollout monitoring — in-process counters, never throws.
 */

const LOG_PREFIX = "[growth:autonomy]";

export type GrowthAutonomyMonitoringState = {
  snapshotsBuilt: number;
  suggestionsSurfaced: number;
  suggestionsBlocked: number;
  approvalRequiredOutcomes: number;
  partialSnapshotCases: number;
  hiddenByMode: number;
  /** Successful GET /api/growth/autonomy responses that returned JSON (non-auth failure). */
  autonomyApiReads: number;
  /** Client-reported validation telemetry (prefill intent, checklist). */
  prefillTelemetryEvents: number;
  validationChecklistCompletions: number;
  validationTelemetryEvents: number;
  trialSnapshotsEvaluated: number;
  trialActivationsCompleted: number;
  trialApprovalsRecorded: number;
  trialDenialsRecorded: number;
  trialRollbacksStarted: number;
  trialRollbacksCompleted: number;
  trialKillFreezeBlocks: number;
};

let state: GrowthAutonomyMonitoringState = {
  snapshotsBuilt: 0,
  suggestionsSurfaced: 0,
  suggestionsBlocked: 0,
  approvalRequiredOutcomes: 0,
  partialSnapshotCases: 0,
  hiddenByMode: 0,
  autonomyApiReads: 0,
  prefillTelemetryEvents: 0,
  validationChecklistCompletions: 0,
  validationTelemetryEvents: 0,
  trialSnapshotsEvaluated: 0,
  trialActivationsCompleted: 0,
  trialApprovalsRecorded: 0,
  trialDenialsRecorded: 0,
  trialRollbacksStarted: 0,
  trialRollbacksCompleted: 0,
  trialKillFreezeBlocks: 0,
};

export function getGrowthAutonomyMonitoringSnapshot(): GrowthAutonomyMonitoringState {
  return { ...state };
}

export function resetGrowthAutonomyMonitoringForTests(): void {
  state = {
    snapshotsBuilt: 0,
    suggestionsSurfaced: 0,
    suggestionsBlocked: 0,
    approvalRequiredOutcomes: 0,
    partialSnapshotCases: 0,
    hiddenByMode: 0,
    autonomyApiReads: 0,
    prefillTelemetryEvents: 0,
    validationChecklistCompletions: 0,
    validationTelemetryEvents: 0,
    trialSnapshotsEvaluated: 0,
    trialActivationsCompleted: 0,
    trialApprovalsRecorded: 0,
    trialDenialsRecorded: 0,
    trialRollbacksStarted: 0,
    trialRollbacksCompleted: 0,
    trialKillFreezeBlocks: 0,
  };
}

export function recordGrowthAutonomyTrialSnapshotEvaluated(): void {
  try {
    state.trialSnapshotsEvaluated += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomyTrialActivationCompleted(): void {
  try {
    state.trialActivationsCompleted += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomyTrialApprovalRecorded(): void {
  try {
    state.trialApprovalsRecorded += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomyTrialDenialRecorded(): void {
  try {
    state.trialDenialsRecorded += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomyTrialRollbackStarted(): void {
  try {
    state.trialRollbacksStarted += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomyTrialRollbackCompleted(): void {
  try {
    state.trialRollbacksCompleted += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomyTrialKillFreezeBlock(): void {
  try {
    state.trialKillFreezeBlocks += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomyApiRead(): void {
  try {
    state.autonomyApiReads += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomyPrefillTelemetryEvent(): void {
  try {
    state.prefillTelemetryEvents += 1;
    state.validationTelemetryEvents += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomyChecklistCompletionEvent(): void {
  try {
    state.validationChecklistCompletions += 1;
    state.validationTelemetryEvents += 1;
  } catch {
    /* noop */
  }
}

export function recordGrowthAutonomySnapshotBuild(args: {
  surfaced: number;
  blocked: number;
  approvalRequired: number;
  hidden: number;
  partialSnapshot: boolean;
}): void {
  try {
    state.snapshotsBuilt += 1;
    state.suggestionsSurfaced += args.surfaced;
    state.suggestionsBlocked += args.blocked;
    state.approvalRequiredOutcomes += args.approvalRequired;
    state.hiddenByMode += args.hidden;
    if (args.partialSnapshot) state.partialSnapshotCases += 1;
    console.info(
      `${LOG_PREFIX} snapshot built surfaced=${args.surfaced} blocked=${args.blocked} approval=${args.approvalRequired} hidden=${args.hidden} partial=${args.partialSnapshot}`,
    );
  } catch {
    /* noop */
  }
}
