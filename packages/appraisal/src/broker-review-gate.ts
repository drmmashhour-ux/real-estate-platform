import type { LecipmBrokerAppraisalCase } from "@prisma/client";

export type AppraisalReviewGateInput = {
  comparablesReviewed: boolean;
  adjustmentsReviewed: boolean;
  assumptionsReviewed: boolean;
  conclusionReviewed: boolean;
  brokerApproved: boolean;
};

export function evaluateAppraisalReportGate(input: AppraisalReviewGateInput): {
  allowed: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.comparablesReviewed) errors.push("COMPARABLES_REVIEW_REQUIRED");
  if (!input.adjustmentsReviewed) errors.push("ADJUSTMENTS_REVIEW_REQUIRED");
  if (!input.assumptionsReviewed) errors.push("ASSUMPTIONS_REVIEW_REQUIRED");
  if (!input.conclusionReviewed) errors.push("CONCLUSION_REVIEW_REQUIRED");
  if (!input.brokerApproved) errors.push("BROKER_APPROVAL_REQUIRED");

  return {
    allowed: errors.length === 0,
    errors,
  };
}

export function evaluateAppraisalReportGateFromCase(row: LecipmBrokerAppraisalCase) {
  return evaluateAppraisalReportGate({
    comparablesReviewed: row.comparablesReviewed,
    adjustmentsReviewed: row.adjustmentsReviewed,
    assumptionsReviewed: row.assumptionsReviewed,
    conclusionReviewed: row.conclusionReviewed,
    brokerApproved: row.brokerApproved,
  });
}

/** Hard stop: broker sign-off must exist before any “finalized” appraisal packet. */
export function assertFinalizeAppraisalBrokerReview(brokerApproved: boolean): void {
  const attemptFinalizeAppraisalWithoutBrokerReview = !brokerApproved;
  if (attemptFinalizeAppraisalWithoutBrokerReview) {
    throw new Error("APPRAISAL_BROKER_REVIEW_REQUIRED");
  }
}

/** Full checklist before finalizing report / export. */
export function assertAppraisalCaseReadyToFinalize(row: LecipmBrokerAppraisalCase): void {
  assertFinalizeAppraisalBrokerReview(row.brokerApproved);
  const g = evaluateAppraisalReportGateFromCase(row);
  if (!g.allowed) {
    throw new Error(g.errors[0] ?? "APPRAISAL_REVIEW_INCOMPLETE");
  }
}
