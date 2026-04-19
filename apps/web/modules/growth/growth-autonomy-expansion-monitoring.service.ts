/**
 * Expansion governance counters — prefix [growth:autonomy:expansion], never throws.
 */

const PREFIX = "[growth:autonomy:expansion]";

export type GrowthAutonomyExpansionMonitoringSnapshot = {
  candidatesEvaluated: number;
  insufficientData: number;
  eligibleTrial: number;
  holdOutcomes: number;
  rollbackFlagged: number;
  auditBlocked: number;
  freezeBlocked: number;
};

let snap: GrowthAutonomyExpansionMonitoringSnapshot = {
  candidatesEvaluated: 0,
  insufficientData: 0,
  eligibleTrial: 0,
  holdOutcomes: 0,
  rollbackFlagged: 0,
  auditBlocked: 0,
  freezeBlocked: 0,
};

export function getGrowthAutonomyExpansionMonitoringSnapshot(): GrowthAutonomyExpansionMonitoringSnapshot {
  return { ...snap };
}

export function resetGrowthAutonomyExpansionMonitoringForTests(): void {
  snap = {
    candidatesEvaluated: 0,
    insufficientData: 0,
    eligibleTrial: 0,
    holdOutcomes: 0,
    rollbackFlagged: 0,
    auditBlocked: 0,
    freezeBlocked: 0,
  };
}

function log(msg: string): void {
  try {
    console.info(`${PREFIX} ${msg}`);
  } catch {
    /* noop */
  }
}

export function recordExpansionCandidateEvaluated(): void {
  try {
    snap.candidatesEvaluated += 1;
    log(`evaluated total=${snap.candidatesEvaluated}`);
  } catch {
    /* noop */
  }
}

export function recordExpansionInsufficientData(): void {
  try {
    snap.insufficientData += 1;
    log(`insufficient_data total=${snap.insufficientData}`);
  } catch {
    /* noop */
  }
}

export function recordExpansionEligibleTrial(): void {
  try {
    snap.eligibleTrial += 1;
    log(`eligible_trial total=${snap.eligibleTrial}`);
  } catch {
    /* noop */
  }
}

export function recordExpansionHold(): void {
  try {
    snap.holdOutcomes += 1;
    log(`hold total=${snap.holdOutcomes}`);
  } catch {
    /* noop */
  }
}

export function recordExpansionRollbackFlag(): void {
  try {
    snap.rollbackFlagged += 1;
    log(`rollback_flag total=${snap.rollbackFlagged}`);
  } catch {
    /* noop */
  }
}

export function recordExpansionAuditBlocked(): void {
  try {
    snap.auditBlocked += 1;
    log(`audit_blocked total=${snap.auditBlocked}`);
  } catch {
    /* noop */
  }
}

export function recordExpansionFreezeBlocked(): void {
  try {
    snap.freezeBlocked += 1;
    log(`freeze_blocked total=${snap.freezeBlocked}`);
  } catch {
    /* noop */
  }
}
