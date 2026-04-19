/**
 * Governance review telemetry — prefix [ops-assistant:review]; never throws.
 */

const LOG_PREFIX = "[ops-assistant:review]";

const counts = {
  pendingSynced: 0,
  reviewsCompleted: 0,
  keep: 0,
  hold: 0,
  rollback: 0,
  futureReview: 0,
  rollbackMarked: 0,
};

function log(msg: string): void {
  try {
    console.info(`${LOG_PREFIX} ${msg}`);
  } catch {
    /* ignore */
  }
}

export function recordGovernanceReviewPendingSynced(): void {
  try {
    counts.pendingSynced += 1;
    log(`pending_synced batch=${counts.pendingSynced}`);
  } catch {
    /* ignore */
  }
}

export function recordGovernanceReviewCompleted(decision: string): void {
  try {
    counts.reviewsCompleted += 1;
    if (decision === "keep") counts.keep += 1;
    if (decision === "hold") counts.hold += 1;
    if (decision === "rollback") counts.rollback += 1;
    if (decision === "future_review") counts.futureReview += 1;
    log(`completed decision=${decision} total=${counts.reviewsCompleted}`);
  } catch {
    /* ignore */
  }
}

export function recordGovernanceRollbackMarked(): void {
  try {
    counts.rollbackMarked += 1;
    log(`rollback_flag_active`);
  } catch {
    /* ignore */
  }
}

export function getGovernanceReviewMonitoringSnapshot(): Readonly<typeof counts> {
  return { ...counts };
}

export function resetGovernanceReviewMonitoringForTests(): void {
  try {
    counts.pendingSynced = 0;
    counts.reviewsCompleted = 0;
    counts.keep = 0;
    counts.hold = 0;
    counts.rollback = 0;
    counts.futureReview = 0;
    counts.rollbackMarked = 0;
  } catch {
    /* ignore */
  }
}
