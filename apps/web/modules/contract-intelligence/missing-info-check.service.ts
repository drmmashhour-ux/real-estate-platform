import type { Deal } from "@prisma/client";
import type { ContractIntelligenceIssue } from "./contract-intelligence.types";

export function detectMissingInfo(deal: Deal): ContractIntelligenceIssue[] {
  const issues: ContractIntelligenceIssue[] = [];
  const meta = deal.executionMetadata as Record<string, unknown> | null;
  if (!meta?.possessionDate) {
    issues.push({
      severity: "warning",
      issueType: "missing_field",
      title: "Possession / occupancy date not captured",
      summary: "Structured execution metadata does not include a possession date.",
      affectedFieldKeys: ["possessionDate"],
      suggestedFix: "Add possession / occupancy timeline after confirming with parties.",
      explanation: ["Possession timing affects conditions and annexes."],
      brokerReviewRequired: true,
    });
  }
  if (!deal.dealExecutionType) {
    issues.push({
      severity: "info",
      issueType: "missing_field",
      title: "Deal execution type not set",
      summary: "Select the closest execution profile to unlock checklist and package hints.",
      affectedFieldKeys: ["dealExecutionType"],
      explanation: ["Classification assists checklists — not a substitute for broker judgment."],
      brokerReviewRequired: true,
    });
  }
  return issues;
}
