/**
 * Operator execution surface — V1 internal markers vs V2 external budget sync eligibility.
 * Does not change core AssistantRecommendation action strings; V2 interprets SCALE/PAUSE for sync.
 */
export type OperatorBudgetSyncEligibility = {
  /** Recommendation action types that may be prepared for external budget sync when V2 flags are on */
  externallySyncableActionTypes: readonly string[];
};

export const OPERATOR_V2_BUDGET_SYNCABLE_ACTIONS = ["SCALE_CAMPAIGN", "PAUSE_CAMPAIGN"] as const;

export function isExternallySyncableBudgetAction(actionType: string): boolean {
  return (OPERATOR_V2_BUDGET_SYNCABLE_ACTIONS as readonly string[]).includes(actionType);
}
