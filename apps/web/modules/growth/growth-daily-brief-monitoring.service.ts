/**
 * Daily brief observability — never throws; does not block callers.
 */

import type { GrowthDailyBriefStatus } from "./growth-daily-brief.types";

export type GrowthDailyBriefMonitoringSnapshot = {
  briefsGenerated: number;
  weakCount: number;
  watchCount: number;
  healthyCount: number;
  strongCount: number;
  missingDataWarnings: number;
};

const snap: GrowthDailyBriefMonitoringSnapshot = {
  briefsGenerated: 0,
  weakCount: 0,
  watchCount: 0,
  healthyCount: 0,
  strongCount: 0,
  missingDataWarnings: 0,
};

export function getGrowthDailyBriefMonitoringSnapshot(): GrowthDailyBriefMonitoringSnapshot {
  return { ...snap };
}

export function resetGrowthDailyBriefMonitoringForTests(): void {
  snap.briefsGenerated = 0;
  snap.weakCount = 0;
  snap.watchCount = 0;
  snap.healthyCount = 0;
  snap.strongCount = 0;
  snap.missingDataWarnings = 0;
}

function bumpStatus(s: GrowthDailyBriefStatus): void {
  if (s === "weak") snap.weakCount += 1;
  else if (s === "watch") snap.watchCount += 1;
  else if (s === "healthy") snap.healthyCount += 1;
  else snap.strongCount += 1;
}

export function logGrowthDailyBriefStarted(): void {
  try {
    console.log(JSON.stringify({ tag: "[growth:daily-brief]", phase: "started" }));
  } catch {
    /* never throw */
  }
}

export function recordGrowthDailyBriefBuild(input: {
  status: GrowthDailyBriefStatus;
  priorityCount: number;
  blockerCount: number;
  missingDataWarnings: number;
}): void {
  try {
    snap.briefsGenerated += 1;
    bumpStatus(input.status);
    snap.missingDataWarnings += input.missingDataWarnings;

    console.log(
      JSON.stringify({
        tag: "[growth:daily-brief]",
        phase: "completed",
        status: input.status,
        priorityCount: input.priorityCount,
        blockerCount: input.blockerCount,
        missingDataWarnings: input.missingDataWarnings,
      }),
    );
  } catch {
    /* never throw */
  }
}
