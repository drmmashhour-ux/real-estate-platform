import type { Deal } from "@prisma/client";
import type { ContractIntelligenceIssue } from "./contract-intelligence.types";

export function detectPriceDepositConflicts(deal: Deal): ContractIntelligenceIssue[] {
  const issues: ContractIntelligenceIssue[] = [];
  const meta = deal.executionMetadata as Record<string, unknown> | null;
  const deposit = typeof meta?.depositCents === "number" ? meta.depositCents : null;
  if (deposit != null && deal.priceCents > 0 && deposit > deal.priceCents) {
    issues.push({
      severity: "critical",
      issueType: "inconsistency",
      title: "Deposit exceeds recorded price",
      summary: "Deposit in metadata is higher than deal price — verify figures.",
      affectedFieldKeys: ["depositCents", "priceCents"],
      brokerReviewRequired: true,
      explanation: ["Cross-check against accepted promise and financing undertakings."],
    });
  }
  return issues;
}
