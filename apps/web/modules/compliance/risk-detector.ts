import type { Deal } from "@prisma/client";
import type { ContractIntelligenceIssue } from "@/modules/contract-intelligence/contract-intelligence.types";

/**
 * Structural risk prompts (non-exhaustive) — complements contract-intelligence rules.
 */
export function detectStructuralRisks(deal: Deal): ContractIntelligenceIssue[] {
  const issues: ContractIntelligenceIssue[] = [];
  const meta = deal.executionMetadata && typeof deal.executionMetadata === "object" ? (deal.executionMetadata as Record<string, unknown>) : {};

  if (deal.possibleBypassFlag) {
    issues.push({
      severity: "warning",
      issueType: "compliance_flag",
      title: "Lead linkage review",
      summary: "Deal was flagged for possible lead-attribution bypass — confirm brokerage policy.",
      explanation: ["Verify Immo / CRM linkage per office compliance rules."],
      brokerReviewRequired: true,
    });
  }

  if (meta.needsAmendment === true && deal.dealExecutionType !== "amendment") {
    issues.push({
      severity: "info",
      issueType: "execution_consistency",
      title: "Amendment intent vs execution type",
      summary: "Metadata suggests an amendment may be required while execution type differs.",
      explanation: ["Reconcile executionMetadata with assigned forms and parties."],
      brokerReviewRequired: true,
    });
  }

  return issues;
}
