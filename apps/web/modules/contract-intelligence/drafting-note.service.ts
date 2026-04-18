import type { ContractIntelligenceIssue } from "./contract-intelligence.types";

export function draftingDisclaimerNote(): ContractIntelligenceIssue {
  return {
    severity: "info",
    issueType: "drafting_note",
    title: "Draft assistance only",
    summary: "LECIPM surfaces structured checks and prompts. Broker approves all material terms.",
    explanation: [
      "No automatic submission to registries or counterparties.",
      "Use publisher-issued OACIQ forms for binding execution.",
    ],
    brokerReviewRequired: true,
  };
}
