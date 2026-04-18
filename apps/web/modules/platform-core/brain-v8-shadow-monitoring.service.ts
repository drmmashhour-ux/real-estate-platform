/**
 * In-process counters for Brain V8 shadow passes — observability only; does not affect Brain behavior.
 */
export type BrainV8ShadowMonitoringSnapshot = {
  passesRun: number;
  persistSuccess: number;
  persistFail: number;
  emptySamplePasses: number;
  auditEmitFail: number;
  snapshotFail: number;
  consecutiveEmptyPasses: number;
};

const state = {
  passesRun: 0,
  persistSuccess: 0,
  persistFail: 0,
  emptySamplePasses: 0,
  auditEmitFail: 0,
  snapshotFail: 0,
  consecutiveEmptyPasses: 0,
};

export function getBrainV8ShadowMonitoringSnapshot(): BrainV8ShadowMonitoringSnapshot {
  return { ...state };
}

/** Test-only reset. */
export function resetBrainV8ShadowMonitoringForTests(): void {
  state.passesRun = 0;
  state.persistSuccess = 0;
  state.persistFail = 0;
  state.emptySamplePasses = 0;
  state.auditEmitFail = 0;
  state.snapshotFail = 0;
  state.consecutiveEmptyPasses = 0;
}

export function brainV8ShadowMonitoringPassCompleted(sampleSize: number): void {
  state.passesRun += 1;
  if (sampleSize === 0) {
    state.emptySamplePasses += 1;
    state.consecutiveEmptyPasses += 1;
  } else {
    state.consecutiveEmptyPasses = 0;
  }
}

export function brainV8ShadowMonitoringPersistResult(ok: boolean): void {
  if (ok) state.persistSuccess += 1;
  else state.persistFail += 1;
}

export function brainV8ShadowMonitoringAuditFail(): void {
  state.auditEmitFail += 1;
}

export function brainV8ShadowMonitoringSnapshotFail(): void {
  state.snapshotFail += 1;
}
