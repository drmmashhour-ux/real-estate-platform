/**
 * Policy enforcement monitoring — never throws.
 */

const LOG_PREFIX = "[growth:policy-enforcement]";

export type GrowthPolicyEnforcementMonitoringState = {
  enforcementBuilds: number;
  blockedTargetsCount: number;
  frozenTargetsCount: number;
  approvalRequiredTargetsCount: number;
  advisoryOnlyTargetsCount: number;
  gatedUiActionsCount: number;
  missingDataWarnings: number;
};

let state: GrowthPolicyEnforcementMonitoringState = {
  enforcementBuilds: 0,
  blockedTargetsCount: 0,
  frozenTargetsCount: 0,
  approvalRequiredTargetsCount: 0,
  advisoryOnlyTargetsCount: 0,
  gatedUiActionsCount: 0,
  missingDataWarnings: 0,
};

export function getGrowthPolicyEnforcementMonitoringSnapshot(): GrowthPolicyEnforcementMonitoringState {
  return { ...state };
}

export function resetGrowthPolicyEnforcementMonitoringForTests(): void {
  state = {
    enforcementBuilds: 0,
    blockedTargetsCount: 0,
    frozenTargetsCount: 0,
    approvalRequiredTargetsCount: 0,
    advisoryOnlyTargetsCount: 0,
    gatedUiActionsCount: 0,
    missingDataWarnings: 0,
  };
}

export function logGrowthPolicyEnforcementBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthPolicyEnforcementBuild(args: {
  blockedCount: number;
  frozenCount: number;
  approvalCount: number;
  advisoryOnlyCount: number;
  notesCount: number;
  missingDataWarningCount: number;
  gatedTargets: import("./growth-policy-enforcement.types").GrowthEnforcementTarget[];
}): void {
  try {
    state.enforcementBuilds += 1;
    state.blockedTargetsCount += args.blockedCount;
    state.frozenTargetsCount += args.frozenCount;
    state.approvalRequiredTargetsCount += args.approvalCount;
    state.advisoryOnlyTargetsCount += args.advisoryOnlyCount;
    state.gatedUiActionsCount += args.gatedTargets.length;
    state.missingDataWarnings += args.missingDataWarningCount;
    console.info(
      `${LOG_PREFIX} build completed blocked=${args.blockedCount} frozen=${args.frozenCount} approval=${args.approvalCount} advisory_only=${args.advisoryOnlyCount} notes=${args.notesCount} warnings=${args.missingDataWarningCount} gated=${args.gatedTargets.slice(0, 8).join(",")}`,
    );
  } catch {
    /* noop */
  }
}
