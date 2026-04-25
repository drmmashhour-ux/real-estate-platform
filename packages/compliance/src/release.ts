/**
 * Final transaction release — AI is not trusted; every flag must pass before execution.
 */
export type TransactionReleaseInput = {
  formOrderValid: boolean;
  draftValid: boolean;
  noContradictions: boolean;
  sourceCoverageValid: boolean;
  brokerReviewDone: boolean;
  brokerSigned: boolean;
  documentHashPresent: boolean;
  dsLinked: boolean;
  /** Platform-issued `ContractRegistry.contractNumber` (or stamped on `Contract`). */
  contractNumberPresent: boolean;
  /** `runInspection` returned `pass`. */
  inspectionPassed: boolean;
  /** Licence / trust / autopilot gates — default true when not evaluated. */
  guardrailsPassed: boolean;
};

export function canReleaseTransaction(input: TransactionReleaseInput): { allowed: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.formOrderValid) errors.push("FORM_ORDER_INVALID");
  if (!input.draftValid) errors.push("DRAFT_INVALID");
  if (!input.noContradictions) errors.push("CONTRADICTION_DETECTED");
  if (!input.sourceCoverageValid) errors.push("SOURCE_NOT_VERIFIED");
  if (!input.brokerReviewDone) errors.push("BROKER_REVIEW_REQUIRED");
  if (!input.brokerSigned) errors.push("SIGNATURE_REQUIRED");
  if (!input.documentHashPresent) errors.push("DOCUMENT_HASH_REQUIRED");
  if (!input.dsLinked) errors.push("DS_LINK_REQUIRED");
  if (!input.contractNumberPresent) errors.push("CONTRACT_NUMBER_REQUIRED");
  if (!input.inspectionPassed) errors.push("INSPECTION_FAILED");
  if (!input.guardrailsPassed) errors.push("COMPLIANCE_GUARDRAILS_NOT_PASSED");

  return {
    allowed: errors.length === 0,
    errors,
  };
}

export function assertTransactionRelease(input: TransactionReleaseInput): void {
  const { allowed, errors } = canReleaseTransaction(input);
  if (!allowed && errors.length > 0) {
    throw new Error(errors[0]);
  }
}
