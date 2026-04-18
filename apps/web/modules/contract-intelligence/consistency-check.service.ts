import type { Deal } from "@prisma/client";
import type { ContractIntelligenceIssue } from "./contract-intelligence.types";

export function detectPartyConsistency(deal: Deal): ContractIntelligenceIssue[] {
  const issues: ContractIntelligenceIssue[] = [];
  const meta = deal.executionMetadata as Record<string, unknown> | null;
  const buyerName = typeof meta?.buyerLegalName === "string" ? meta.buyerLegalName.trim() : "";
  const sellerName = typeof meta?.sellerLegalName === "string" ? meta.sellerLegalName.trim() : "";
  if (buyerName && sellerName && buyerName.toLowerCase() === sellerName.toLowerCase()) {
    issues.push({
      severity: "critical",
      issueType: "inconsistency",
      title: "Buyer and seller legal names match — verify",
      summary: "Structured names appear identical; likely data entry issue.",
      suggestedFix: "Reconcile with IDs and official records before any instrument.",
      explanation: ["Identity consistency is required across all schedules."],
      brokerReviewRequired: true,
    });
  }
  return issues;
}
