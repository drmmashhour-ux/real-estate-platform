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
  /** Action bridge: candidates before dedupe in a bundle build. */
  actionBundlesGenerated: number;
  actionsGeneratedTotal: number;
  topActionsGenerated: number;
  missionActionClicks: number;
  missionActionNavByTarget: Record<string, number>;
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
  actionBundlesGenerated: 0,
  actionsGeneratedTotal: 0,
  topActionsGenerated: 0,
  missionActionClicks: 0,
  missionActionNavByTarget: {},
};

export function getGrowthMissionControlMonitoringSnapshot(): GrowthMissionControlMonitoringState {
  return { ...state, missionActionNavByTarget: { ...state.missionActionNavByTarget } };
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
    actionBundlesGenerated: 0,
    actionsGeneratedTotal: 0,
    topActionsGenerated: 0,
    missionActionClicks: 0,
    missionActionNavByTarget: {},
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

export function recordMissionControlActionsBuilt(args: {
  candidateCount: number;
  rankedCount: number;
  topGenerated: boolean;
  listCount: number;
}): void {
  try {
    state.actionBundlesGenerated += 1;
    state.actionsGeneratedTotal += args.listCount + (args.topGenerated ? 1 : 0);
    if (args.topGenerated) state.topActionsGenerated += 1;
    console.info(
      `${LOG_PREFIX} actions bundle candidates=${args.candidateCount} ranked=${args.rankedCount} top=${args.topGenerated ? "y" : "n"} list=${args.listCount}`,
    );
  } catch {
    /* noop */
  }
}

export function recordMissionControlActionClick(args: {
  navTarget: string;
  actionId: string;
  role: "top" | "list";
}): void {
  try {
    state.missionActionClicks += 1;
    const k = args.navTarget;
    state.missionActionNavByTarget[k] = (state.missionActionNavByTarget[k] ?? 0) + 1;
    console.info(
      `${LOG_PREFIX} action click role=${args.role} id=${args.actionId} nav=${args.navTarget}`,
    );
  } catch {
    /* noop */
  }
}
