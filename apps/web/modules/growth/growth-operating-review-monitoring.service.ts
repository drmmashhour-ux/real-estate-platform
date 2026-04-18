/**
 * Operating review build telemetry — counters only; never throws; no I/O.
 */

import type { GrowthOperatingReviewStatus } from "./growth-operating-review.types";

export type GrowthOperatingReviewMonitoringSnapshot = {
  reviewBuilds: number;
  workedCount: number;
  didntWorkCount: number;
  blockedCount: number;
  deferredCount: number;
  nextWeekChangeCount: number;
  missingDataWarnings: number;
  lastStatus: GrowthOperatingReviewStatus | null;
  lastBuildAt: string | null;
};

const LOG = "[growth:operating-review]";

let reviewBuilds = 0;
let workedCount = 0;
let didntWorkCount = 0;
let blockedCount = 0;
let deferredCount = 0;
let nextWeekChangeCount = 0;
let missingDataWarnings = 0;
let lastStatus: GrowthOperatingReviewStatus | null = null;
let lastBuildAt: string | null = null;

function safeLog(line: string): void {
  try {
    console.info(`${LOG} ${line}`);
  } catch {
    /* ignore */
  }
}

export function logGrowthOperatingReviewBuildStarted(): void {
  safeLog("build started");
}

export function recordGrowthOperatingReviewBuild(args: {
  status: GrowthOperatingReviewStatus;
  worked: number;
  didntWork: number;
  blocked: number;
  deferred: number;
  nextWeekChanges: number;
  missingDataWarnings: number;
}): void {
  try {
    reviewBuilds += 1;
    workedCount += args.worked;
    didntWorkCount += args.didntWork;
    blockedCount += args.blocked;
    deferredCount += args.deferred;
    nextWeekChangeCount += args.nextWeekChanges;
    missingDataWarnings += args.missingDataWarnings;
    lastStatus = args.status;
    lastBuildAt = new Date().toISOString();
    safeLog(
      `build completed status=${args.status} worked=${args.worked} didnt=${args.didntWork} blocked=${args.blocked} deferred=${args.deferred} nextWeek=${args.nextWeekChanges} warnings=${args.missingDataWarnings}`,
    );
  } catch {
    /* never throw */
  }
}

export function getGrowthOperatingReviewMonitoringSnapshot(): GrowthOperatingReviewMonitoringSnapshot {
  return {
    reviewBuilds,
    workedCount,
    didntWorkCount,
    blockedCount,
    deferredCount,
    nextWeekChangeCount,
    missingDataWarnings,
    lastStatus,
    lastBuildAt,
  };
}

/** Test-only reset — does not throw. */
export function resetGrowthOperatingReviewMonitoringForTests(): void {
  try {
    reviewBuilds = 0;
    workedCount = 0;
    didntWorkCount = 0;
    blockedCount = 0;
    deferredCount = 0;
    nextWeekChangeCount = 0;
    missingDataWarnings = 0;
    lastStatus = null;
    lastBuildAt = null;
  } catch {
    /* ignore */
  }
}
