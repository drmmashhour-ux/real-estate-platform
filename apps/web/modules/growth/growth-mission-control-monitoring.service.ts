/**
 * Mission control monitoring — never throws.
 */

const LOG_PREFIX = "[growth:mission-control]";

export type GrowthMissionControlMonitoringState = {
  missionControlBuilds: number;
  weakCount: number;
  watchCount: number;
  healthyCount: number;
  strongCount: number;
  checklistItemsGenerated: number;
  risksMerged: number;
  reviewItemsMerged: number;
  missingDataWarnings: number;
  /** Sum of checklist + risk + review dedupe collapses in a build (advisory metric). */
  dedupeEvents: number;
};

let state: GrowthMissionControlMonitoringState = {
  missionControlBuilds: 0,
  weakCount: 0,
  watchCount: 0,
  healthyCount: 0,
  strongCount: 0,
  checklistItemsGenerated: 0,
  risksMerged: 0,
  reviewItemsMerged: 0,
  missingDataWarnings: 0,
  dedupeEvents: 0,
};

export function getGrowthMissionControlMonitoringSnapshot(): GrowthMissionControlMonitoringState {
  return { ...state };
}

export function resetGrowthMissionControlMonitoringForTests(): void {
  state = {
    missionControlBuilds: 0,
    weakCount: 0,
    watchCount: 0,
    healthyCount: 0,
    strongCount: 0,
    checklistItemsGenerated: 0,
    risksMerged: 0,
    reviewItemsMerged: 0,
    missingDataWarnings: 0,
    dedupeEvents: 0,
  };
}

export function logGrowthMissionControlBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthMissionControlBuild(args: {
  status: "weak" | "watch" | "healthy" | "strong";
  missionFocusTitle?: string;
  checklistCount: number;
  riskCount: number;
  reviewCount: number;
  missingDataWarningCount: number;
  dedupeEvents?: number;
  noteCount?: number;
}): void {
  try {
    state.missionControlBuilds += 1;
    state.checklistItemsGenerated += args.checklistCount;
    state.risksMerged += args.riskCount;
    state.reviewItemsMerged += args.reviewCount;
    state.missingDataWarnings += args.missingDataWarningCount;
    state.dedupeEvents += args.dedupeEvents ?? 0;
    if (args.status === "weak") state.weakCount += 1;
    else if (args.status === "watch") state.watchCount += 1;
    else if (args.status === "healthy") state.healthyCount += 1;
    else state.strongCount += 1;

    const dedupe = args.dedupeEvents ?? 0;
    const notes = args.noteCount ?? 0;
    console.info(
      `${LOG_PREFIX} build completed status=${args.status} focus=${args.missionFocusTitle ?? "(none)"} checklist=${args.checklistCount} risks=${args.riskCount} reviews=${args.reviewCount} warnings=${args.missingDataWarningCount} dedupe=${dedupe} notes=${notes}`,
    );
  } catch {
    /* noop */
  }
}
