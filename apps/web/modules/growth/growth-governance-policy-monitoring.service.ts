/**
 * Governance policy monitoring — never throws.
 */

const LOG_PREFIX = "[growth:governance:policy]";

export type GrowthGovernancePolicyMonitoringState = {
  policyBuilds: number;
  blockedDomainCount: number;
  frozenDomainCount: number;
  reviewRequiredDomainCount: number;
  advisoryOnlyDomainCount: number;
  missingDataWarnings: number;
};

let state: GrowthGovernancePolicyMonitoringState = {
  policyBuilds: 0,
  blockedDomainCount: 0,
  frozenDomainCount: 0,
  reviewRequiredDomainCount: 0,
  advisoryOnlyDomainCount: 0,
  missingDataWarnings: 0,
};

export function getGrowthGovernancePolicyMonitoringSnapshot(): GrowthGovernancePolicyMonitoringState {
  return { ...state };
}

export function resetGrowthGovernancePolicyMonitoringForTests(): void {
  state = {
    policyBuilds: 0,
    blockedDomainCount: 0,
    frozenDomainCount: 0,
    reviewRequiredDomainCount: 0,
    advisoryOnlyDomainCount: 0,
    missingDataWarnings: 0,
  };
}

export function logGrowthGovernancePolicyBuildStarted(): void {
  try {
    console.info(`${LOG_PREFIX} build started`);
  } catch {
    /* noop */
  }
}

export function recordGrowthGovernancePolicyBuild(args: {
  blockedCount: number;
  frozenCount: number;
  reviewCount: number;
  advisoryOnlyCount: number;
  notesCount: number;
  missingDataWarningCount: number;
}): void {
  try {
    state.policyBuilds += 1;
    state.blockedDomainCount += args.blockedCount;
    state.frozenDomainCount += args.frozenCount;
    state.reviewRequiredDomainCount += args.reviewCount;
    state.advisoryOnlyDomainCount += args.advisoryOnlyCount;
    state.missingDataWarnings += args.missingDataWarningCount;
    console.info(
      `${LOG_PREFIX} build completed blocked=${args.blockedCount} frozen=${args.frozenCount} review=${args.reviewCount} advisory_only=${args.advisoryOnlyCount} notes=${args.notesCount} warnings=${args.missingDataWarningCount}`,
    );
  } catch {
    /* noop */
  }
}
