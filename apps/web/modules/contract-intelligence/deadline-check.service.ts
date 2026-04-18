import type { Deal } from "@prisma/client";
import type { ContractIntelligenceIssue } from "./contract-intelligence.types";

export function detectDeadlineIssues(deal: Deal): ContractIntelligenceIssue[] {
  const issues: ContractIntelligenceIssue[] = [];
  const meta = deal.executionMetadata as Record<string, unknown> | null;
  const financingDeadline = meta?.financingDeadline;
  const inspectionDeadline = meta?.inspectionDeadline;
  if (
    typeof financingDeadline === "string" &&
    typeof inspectionDeadline === "string" &&
    financingDeadline &&
    inspectionDeadline &&
    new Date(financingDeadline) < new Date(inspectionDeadline)
  ) {
    issues.push({
      severity: "warning",
      issueType: "deadline_order",
      title: "Financing deadline precedes inspection deadline",
      summary: "Confirm condition sequencing matches brokerage risk policy.",
      explanation: ["Some workflows require inspection before financing waiver — broker judgment required."],
      brokerReviewRequired: true,
    });
  }
  return issues;
}
