export type ComplianceFormStep =
  | "identity_verification"
  | "brokerage_contract"
  | "seller_declaration"
  | "disclosures"
  | "promise_to_purchase"
  | "trust_deposit"
  | "final_review"
  | "signature"
  | "complete";

export type FormOrderContext = {
  listingId?: string | null;
  dealId?: string | null;
  actorId: string;
  mode: "sale" | "purchase" | "lease" | "vacation_resort";
  hasIdentityVerification: boolean;
  hasBrokerageContract: boolean;
  hasSellerDeclaration: boolean;
  hasDisclosurePackage: boolean;
  hasPromiseToPurchase: boolean;
  hasTrustDepositWorkflow: boolean;
  finalReviewCompleted: boolean;
  brokerSigned: boolean;
};

export function getNextRequiredStep(ctx: FormOrderContext): ComplianceFormStep {
  if (!ctx.hasIdentityVerification) return "identity_verification";
  if (!ctx.hasBrokerageContract) return "brokerage_contract";
  if (ctx.mode === "sale" && !ctx.hasSellerDeclaration) return "seller_declaration";
  if (!ctx.hasDisclosurePackage) return "disclosures";
  if (!ctx.hasPromiseToPurchase) return "promise_to_purchase";
  if (ctx.mode === "vacation_resort" && !ctx.hasTrustDepositWorkflow) return "trust_deposit";
  if (!ctx.finalReviewCompleted) return "final_review";
  return "signature";
}

export function canAccessStep(ctx: FormOrderContext, requestedStep: ComplianceFormStep): boolean {
  const next = getNextRequiredStep(ctx);

  const orderedSteps: ComplianceFormStep[] = [
    "identity_verification",
    "brokerage_contract",
    "seller_declaration",
    "disclosures",
    "promise_to_purchase",
    "trust_deposit",
    "final_review",
    "signature",
    "complete",
  ];

  return orderedSteps.indexOf(requestedStep) <= orderedSteps.indexOf(next);
}
