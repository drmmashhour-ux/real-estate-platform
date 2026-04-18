import type { Deal } from "@prisma/client";
import type { ContractIntelligenceIssue } from "./contract-intelligence.types";

export function coownershipRiskPrompts(deal: Deal): ContractIntelligenceIssue[] {
  const issues: ContractIntelligenceIssue[] = [];
  const meta = deal.executionMetadata as Record<string, unknown> | null;
  if (meta?.coOwnership === "divided") {
    issues.push({
      severity: "info",
      issueType: "risk_prompt",
      title: "Divided co-ownership — syndicate documentation",
      summary: "Ensure required syndicate / co-ownership documents are obtained per brokerage checklist.",
      explanation: ["Official annex requirements depend on context — verify against current forms."],
      brokerReviewRequired: true,
    });
  }
  return issues;
}
