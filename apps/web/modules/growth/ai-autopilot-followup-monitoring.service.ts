/**
 * In-process metrics + structured logs for internal follow-up workflow (no outbound sends).
 */

import { logInfo } from "@/lib/logger";

const counts = {
  followUpRuns: 0,
  leadsQueued: 0,
  leadsDueNow: 0,
  leadsWaiting: 0,
  leadsDone: 0,
  executionFailures: 0,
  snoozedCount: 0,
  markedDoneCount: 0,
};

export function resetFollowUpMonitoringForTests(): void {
  counts.followUpRuns = 0;
  counts.leadsQueued = 0;
  counts.leadsDueNow = 0;
  counts.leadsWaiting = 0;
  counts.leadsDone = 0;
  counts.executionFailures = 0;
  counts.snoozedCount = 0;
  counts.markedDoneCount = 0;
}

export function getFollowUpMonitoringSnapshot(): Readonly<typeof counts> {
  return { ...counts };
}

export function recordFollowUpRunSummary(opts: {
  processed: number;
  dueNow: number;
  queued: number;
  waiting: number;
  done: number;
  failures: number;
  topQueuePreview?: string[];
}): void {
  counts.followUpRuns += 1;
  counts.leadsQueued += opts.queued;
  counts.leadsDueNow += opts.dueNow;
  counts.leadsWaiting += opts.waiting;
  counts.leadsDone += opts.done;
  counts.executionFailures += opts.failures;

  logInfo("[autopilot:followup]", {
    event: "run_completed",
    processed: opts.processed,
    due_now: opts.dueNow,
    queued: opts.queued,
    waiting: opts.waiting,
    done: opts.done,
    failures: opts.failures,
    top_queue: opts.topQueuePreview ?? [],
  });
}

export function recordFollowUpRunStarted(leadsCount: number): void {
  logInfo("[autopilot:followup]", {
    event: "run_started",
    leads_count: leadsCount,
  });
}

export function recordFollowUpFailure(leadId: string, reason: string): void {
  logInfo("[autopilot:followup]", {
    event: "lead_failed",
    leadId,
    reason,
  });
}

export function recordSnoozed(): void {
  counts.snoozedCount += 1;
}

export function recordMarkedDone(): void {
  counts.markedDoneCount += 1;
}
