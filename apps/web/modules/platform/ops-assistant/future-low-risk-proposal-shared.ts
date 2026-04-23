import type { FutureLowRiskActionProposalReviewChecklist } from "./future-low-risk-proposal.types";

export const CHECKLIST_KEYS = [
  "internalOnlyConfirmed",
  "reversibleConfirmed",
  "noPaymentImpact",
  "noBookingCoreImpact",
  "noAdsCoreImpact",
  "noCroCoreImpact",
  "noExternalSendImpact",
  "noLivePricingImpact",
  "adjacentToCurrentLowRiskScope",
  "clearRollbackExists",
  "clearAuditabilityExists",
] as const satisfies ReadonlyArray<keyof FutureLowRiskActionProposalReviewChecklist>;

export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];

export const CHECKLIST_LABELS: Record<ChecklistKey, string> = {
  internalOnlyConfirmed: "Internal-only confirmed",
  reversibleConfirmed: "Reversible confirmed",
  noPaymentImpact: "No payment impact",
  noBookingCoreImpact: "No booking-core impact",
  noAdsCoreImpact: "No ads-core impact",
  noCroCoreImpact: "No CRO-core impact",
  noExternalSendImpact: "No external-send impact",
  noLivePricingImpact: "No live pricing impact",
  adjacentToCurrentLowRiskScope: "Adjacent to current low-risk scope",
  clearRollbackExists: "Clear rollback exists",
  clearAuditabilityExists: "Clear auditability exists",
};
