/**
 * Enforces OACIQ-style sequential workflow — no skipped steps before drafting / execution.
 */
export type FormOrderStep = "identity" | "brokerage" | "ds" | "promise" | "review" | "signature";

export type FormOrderInput = {
  identityVerified: boolean;
  brokerageContractSigned: boolean;
  sellerDeclarationCompleted: boolean;
  promiseToPurchaseSigned: boolean;
  finalReviewCompleted: boolean;
  signatureCompleted: boolean;
  transactionType: "sale" | "purchase" | "lease";
};

const CANONICAL_ORDER: FormOrderStep[] = ["identity", "brokerage", "ds", "promise", "review", "signature"];

function stepSatisfied(input: FormOrderInput, step: FormOrderStep): boolean {
  switch (step) {
    case "identity":
      return input.identityVerified;
    case "brokerage":
      return input.brokerageContractSigned;
    case "ds":
      return input.transactionType !== "sale" || input.sellerDeclarationCompleted;
    case "promise":
      return input.promiseToPurchaseSigned;
    case "review":
      return input.finalReviewCompleted;
    case "signature":
      return input.signatureCompleted;
    default:
      return false;
  }
}

/** Block reaching a later workflow step when prior mandatory steps are incomplete. */
export function assertFormOrderStepAccess(input: FormOrderInput, targetStep: FormOrderStep): void {
  const targetIdx = CANONICAL_ORDER.indexOf(targetStep);
  if (targetIdx < 0) {
    throw new Error("FORM_ORDER_VIOLATION");
  }
  for (let i = 0; i < targetIdx; i++) {
    const step = CANONICAL_ORDER[i];
    if (!stepSatisfied(input, step)) {
      throw new Error("FORM_ORDER_VIOLATION");
    }
  }
}

export function enforceFormOrder(input: FormOrderInput): void {
  if (!input.identityVerified) {
    throw new Error("IDENTITY_VERIFICATION_REQUIRED");
  }

  if (!input.brokerageContractSigned) {
    throw new Error("BROKERAGE_CONTRACT_REQUIRED");
  }

  if (input.transactionType === "sale" && !input.sellerDeclarationCompleted) {
    throw new Error("SELLER_DECLARATION_REQUIRED");
  }

  if (!input.promiseToPurchaseSigned) {
    throw new Error("PROMISE_TO_PURCHASE_REQUIRED");
  }

  if (!input.finalReviewCompleted) {
    throw new Error("FINAL_REVIEW_REQUIRED");
  }

  if (!input.signatureCompleted) {
    throw new Error("SIGNATURE_REQUIRED");
  }
}

/** UI / advisory step labels for broker workflow (annex & notice are context-specific). */
export type FormStep =
  | "identity_verification"
  | "brokerage_contract"
  | "seller_declaration"
  | "disclosure"
  | "promise_to_purchase"
  | "annex"
  | "notice"
  | "review"
  | "signature";

/** Next blocking step before finalization (sale requires seller declaration). */
export function getRequiredNextStep(input: {
  transactionType: "sale" | "purchase" | "lease" | "vacation_resort";
  hasIdentityVerification: boolean;
  hasBrokerageContract: boolean;
  hasSellerDeclaration: boolean;
  hasDisclosure: boolean;
  hasPromiseToPurchase: boolean;
  reviewCompleted: boolean;
  signed: boolean;
}): FormStep {
  if (!input.hasIdentityVerification) return "identity_verification";
  if (!input.hasBrokerageContract) return "brokerage_contract";
  if (input.transactionType === "sale" && !input.hasSellerDeclaration) return "seller_declaration";
  if (!input.hasDisclosure) return "disclosure";
  if (!input.hasPromiseToPurchase) return "promise_to_purchase";
  if (!input.reviewCompleted) return "review";
  return "signature";
}
