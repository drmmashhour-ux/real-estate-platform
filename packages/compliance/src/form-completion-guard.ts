/**
 * Throws explicit errors when mandatory compliance steps are incomplete.
 * Aligns with brokerage workflow: identity → brokerage contract → DS (sale) → … → review → signature.
 */

export type CompletionGuardInput = {
  identityVerified: boolean;
  brokerageContractSigned: boolean;
  sellerDeclarationCompleted: boolean;
  promiseToPurchaseSigned: boolean;
  finalReviewCompleted: boolean;
  signatureCompleted: boolean;
  mode: "sale" | "purchase" | "lease" | "vacation_resort";
};

export function assertComplianceCompletionOrder(flags: CompletionGuardInput): void {
  if (!flags.identityVerified) throw new Error("IDENTITY_VERIFICATION_REQUIRED");
  if (!flags.brokerageContractSigned) throw new Error("BROKERAGE_CONTRACT_REQUIRED");
  if (flags.mode === "sale" && !flags.sellerDeclarationCompleted) {
    throw new Error("SELLER_DECLARATION_REQUIRED");
  }
  if (!flags.promiseToPurchaseSigned) throw new Error("PROMISE_TO_PURCHASE_REQUIRED");
  if (!flags.finalReviewCompleted) throw new Error("FINAL_REVIEW_REQUIRED");
  if (!flags.signatureCompleted) throw new Error("SIGNATURE_REQUIRED");
}
