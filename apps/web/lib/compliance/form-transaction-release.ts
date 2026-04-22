export type TransactionReleaseInput = {
  stepOrderValid: boolean;
  formsValid: boolean;
  brokerReviewCompleted: boolean;
  brokerSigned: boolean;
  guardrailsPassed: boolean;
  identityVerified: boolean;
  mandatoryFormsPresent: boolean;
  /** When set, enforces immutable signature timestamp for release */
  signature?: {
    signedAt: Date | string | null | undefined;
    signedDate?: string | null;
  } | null;
  /** SHA-256 of canonical document body at signing */
  documentHash?: string | null;
  /** Listing and/or contract linkage satisfied */
  linkedToTransaction?: boolean;
};

export function canReleaseTransaction(input: TransactionReleaseInput): { allowed: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.stepOrderValid) errors.push("FORM_ORDER_INVALID");
  if (!input.formsValid) errors.push("FORM_VALIDATION_FAILED");
  if (!input.brokerReviewCompleted) errors.push("BROKER_REVIEW_REQUIRED");
  if (!input.brokerSigned) errors.push("BROKER_SIGNATURE_REQUIRED");
  if (!input.guardrailsPassed) errors.push("COMPLIANCE_GUARDRAILS_NOT_PASSED");
  if (!input.identityVerified) errors.push("IDENTITY_VERIFICATION_REQUIRED");
  if (!input.mandatoryFormsPresent) errors.push("MANDATORY_FORMS_MISSING");

  const sig = input.signature;

  if (input.enforceSigningChain) {
    if (!sig?.signedAt) {
      errors.push("SIGNATURE_REQUIRED");
    }
    if (!input.documentHash?.trim()) {
      errors.push("DOCUMENT_INTEGRITY_REQUIRED");
    }
    if (input.linkedToTransaction !== true) {
      errors.push("DOCUMENT_LINK_REQUIRED");
    }
  } else if (sig !== undefined && sig !== null) {
    if (!sig.signedAt && !sig.signedDate) {
      errors.push("SIGNATURE_REQUIRED");
    }
  }

  if (!input.enforceSigningChain && input.documentHash !== undefined && input.documentHash !== null) {
    if (!String(input.documentHash).trim()) {
      errors.push("DOCUMENT_INTEGRITY_REQUIRED");
    }
  }

  if (!input.enforceSigningChain && input.linkedToTransaction === false) {
    errors.push("DOCUMENT_LINK_REQUIRED");
  }

  return {
    allowed: errors.length === 0,
    errors,
  };
}

/**
 * Strict release gate — throws first blocking error (for API routes).
 */
export function assertTransactionRelease(input: TransactionReleaseInput): void {
  const { allowed, errors } = canReleaseTransaction(input);
  if (!allowed && errors.length > 0) {
    throw new Error(errors[0]);
  }
}
