import type { TransactionContext } from "./transaction-context.types";

export type LegalBoundaryCapabilities = {
  negotiationAi: boolean;
  offerGenerator: boolean;
  pricingAiFull: boolean;
  investorMatching: boolean;
  executionEngine: boolean;
  contractGeneration: boolean;
  closingWorkflowAi: boolean;
  listingDisplay: boolean;
  basicSearch: boolean;
  neutralMessaging: boolean;
  simpleCalculators: boolean;
  neutralDocumentTemplates: boolean;
};

/** AI / automation capabilities allowed under OACIQ boundary rules for this transaction. */
export function getAllowedCapabilities(context: TransactionContext): LegalBoundaryCapabilities {
  if (context.mode === "BROKERED") {
    return {
      negotiationAi: true,
      offerGenerator: true,
      pricingAiFull: true,
      investorMatching: true,
      executionEngine: true,
      contractGeneration: true,
      closingWorkflowAi: true,
      listingDisplay: true,
      basicSearch: true,
      neutralMessaging: true,
      simpleCalculators: true,
      neutralDocumentTemplates: true,
    };
  }

  return {
    negotiationAi: false,
    offerGenerator: false,
    pricingAiFull: false,
    investorMatching: false,
    executionEngine: false,
    contractGeneration: false,
    closingWorkflowAi: false,
    listingDisplay: true,
    basicSearch: true,
    neutralMessaging: true,
    simpleCalculators: true,
    neutralDocumentTemplates: true,
  };
}
