export function canReleaseDraftedTransaction(input: {
  stepOrderValid: boolean;
  draftValidationPassed: boolean;
  contradictionCheckPassed: boolean;
  sourceCoveragePassed: boolean;
  requiredReviewFieldsResolved: boolean;
  brokerReviewCompleted: boolean;
  brokerSigned: boolean;
  guardrailsPassed: boolean;
}) {
  const errors: string[] = [];
  if (!input.stepOrderValid) errors.push("FORM_ORDER_INVALID");
  if (!input.draftValidationPassed) errors.push("DRAFT_VALIDATION_FAILED");
  if (!input.contradictionCheckPassed) errors.push("DRAFT_CONTRADICTION_DETECTED");
  if (!input.sourceCoveragePassed) errors.push("SOURCE_COVERAGE_INSUFFICIENT");
  if (!input.requiredReviewFieldsResolved) errors.push("REQUIRED_REVIEW_FIELDS_REMAIN");
  if (!input.brokerReviewCompleted) errors.push("BROKER_REVIEW_REQUIRED");
  if (!input.brokerSigned) errors.push("BROKER_SIGNATURE_REQUIRED");
  if (!input.guardrailsPassed) errors.push("COMPLIANCE_GUARDRAILS_NOT_PASSED");
  return {
    allowed: errors.length === 0,
    errors,
  };
}
