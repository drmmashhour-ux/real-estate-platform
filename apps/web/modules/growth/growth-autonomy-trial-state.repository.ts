/**
 * In-process trial approval + activation record — internal rollout; single slot.
 */

import type { GrowthAutonomyTrialApprovalRecord } from "./growth-autonomy-trial.types";

/** At most one approval record per runtime (approved → active → rolled_back). */
let approvalRecord: GrowthAutonomyTrialApprovalRecord | null = null;

export function getGrowthAutonomyTrialApprovalRecord(): GrowthAutonomyTrialApprovalRecord | null {
  return approvalRecord;
}

export function setGrowthAutonomyTrialApprovalRecord(record: GrowthAutonomyTrialApprovalRecord | null): void {
  approvalRecord = record;
}

export function resetGrowthAutonomyTrialStateForTests(): void {
  approvalRecord = null;
}

/** True when a trial occupies the slot (approved pending activation, active, or proposed awaiting resolution). */
export function growthAutonomyTrialSlotOccupied(): boolean {
  if (!approvalRecord) return false;
  return (
    approvalRecord.activationStatus === "proposed" ||
    approvalRecord.activationStatus === "approved_internal_trial" ||
    approvalRecord.activationStatus === "active"
  );
}
