/**
 * Executive panel observability — never throws.
 */

import type { GrowthExecutiveStatus } from "./growth-executive.types";

export type GrowthExecutiveMonitoringCounters = {
  executiveBuilds: number;
  weakCount: number;
  watchCount: number;
  healthyCount: number;
  strongCount: number;
  missingDataWarnings: number;
};

const counters: GrowthExecutiveMonitoringCounters = {
  executiveBuilds: 0,
  weakCount: 0,
  watchCount: 0,
  healthyCount: 0,
  strongCount: 0,
  missingDataWarnings: 0,
};

export function getGrowthExecutiveMonitoringCounters(): GrowthExecutiveMonitoringCounters {
  return { ...counters };
}

export function resetGrowthExecutiveMonitoringForTests(): void {
  counters.executiveBuilds = 0;
  counters.weakCount = 0;
  counters.watchCount = 0;
  counters.healthyCount = 0;
  counters.strongCount = 0;
  counters.missingDataWarnings = 0;
}

function bumpStatus(s: GrowthExecutiveStatus): void {
  if (s === "weak") counters.weakCount += 1;
  else if (s === "watch") counters.watchCount += 1;
  else if (s === "healthy") counters.healthyCount += 1;
  else counters.strongCount += 1;
}

export function recordGrowthExecutiveBuild(input: {
  status: GrowthExecutiveStatus;
  topPriority?: string;
  priorityCount: number;
  missingDataNotes: string[];
}): void {
  try {
    counters.executiveBuilds += 1;
    bumpStatus(input.status);
    counters.missingDataWarnings += input.missingDataNotes.length;

    console.log(
      JSON.stringify({
        tag: "[growth:executive]",
        phase: "completed",
        status: input.status,
        topPriority: input.topPriority ?? null,
        priorityCount: input.priorityCount,
        missingDataNotes: input.missingDataNotes.slice(0, 8),
      }),
    );
  } catch {
    /* never throw */
  }
}

export function logGrowthExecutiveBuildStarted(): void {
  try {
    console.log(JSON.stringify({ tag: "[growth:executive]", phase: "started" }));
  } catch {
    /* never throw */
  }
}
