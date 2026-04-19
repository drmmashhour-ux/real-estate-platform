/**
 * Future review registry telemetry — [ops-assistant:future-review]; never throws.
 */

const LOG_PREFIX = "[ops-assistant:future-review]";

const counts = {
  added: 0,
  updated: 0,
  archived: 0,
  rejected: 0,
};

function log(msg: string): void {
  try {
    console.info(`${LOG_PREFIX} ${msg}`);
  } catch {
    /* ignore */
  }
}

export function recordFutureReviewCandidateAdded(): void {
  try {
    counts.added += 1;
    log(`candidate_added total=${counts.added}`);
  } catch {
    /* ignore */
  }
}

export function recordFutureReviewCandidateUpdated(kind: string): void {
  try {
    counts.updated += 1;
    log(`candidate_updated kind=${kind} total=${counts.updated}`);
  } catch {
    /* ignore */
  }
}

export function recordFutureReviewCandidateArchived(): void {
  try {
    counts.archived += 1;
    log(`candidate_archived total=${counts.archived}`);
  } catch {
    /* ignore */
  }
}

export function recordFutureReviewCandidateRejected(): void {
  try {
    counts.rejected += 1;
    log(`candidate_rejected total=${counts.rejected}`);
  } catch {
    /* ignore */
  }
}

export function getFutureReviewCandidateMonitoringSnapshot(): Readonly<typeof counts> {
  return { ...counts };
}

export function resetFutureReviewCandidateMonitoringForTests(): void {
  try {
    counts.added = 0;
    counts.updated = 0;
    counts.archived = 0;
    counts.rejected = 0;
  } catch {
    /* ignore */
  }
}
