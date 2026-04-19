/**
 * Expansion discipline relative to adjacent internal trial measurement — governance only.
 */

export type GrowthAutonomyTrialExpansionGovernanceLock = {
  /** When true, expansion trial approvals via expansion API should be refused. */
  blocksExpansionApprovals: boolean;
  reason: string;
  trialMeasurementReady: boolean;
};

export function evaluateAdjacentTrialExpansionGovernanceLock(args: {
  trialFeatureOn: boolean;
  trialEverExecuted: boolean;
  trialOutcomeMeasured: boolean;
}): GrowthAutonomyTrialExpansionGovernanceLock {
  if (!args.trialFeatureOn || !args.trialEverExecuted) {
    return { blocksExpansionApprovals: false, reason: "", trialMeasurementReady: args.trialOutcomeMeasured };
  }

  if (!args.trialOutcomeMeasured) {
    return {
      blocksExpansionApprovals: true,
      reason:
        "Adjacent internal trial has executed — measure results (trial results panel / GET trial results) before any expansion approvals.",
      trialMeasurementReady: false,
    };
  }

  return {
    blocksExpansionApprovals: true,
    reason:
      "Trial results exist — automatic expansion pathways stay frozen; only explicit organizational governance may revisit scope later.",
    trialMeasurementReady: true,
  };
}
