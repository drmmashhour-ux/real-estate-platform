import { prisma } from "@/lib/db";
import type { ComplianceRuleHit } from "./compliance-rules.types";

export async function runClosingRules(dealId: string): Promise<ComplianceRuleHit[]> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      lecipmExecutionPipelineState: true,
      status: true,
    },
  });
  if (!deal) return [];

  const overdueReq = await prisma.dealRequest.count({
    where: {
      dealId,
      status: { notIn: ["FULFILLED", "CANCELLED"] },
      dueAt: { lt: new Date() },
    },
  });

  if (deal.lecipmExecutionPipelineState === "closing_ready" && overdueReq > 0) {
    return [
      {
        ruleKey: "closing.ready_with_overdue_requests",
        caseType: "closing_readiness_risk",
        severity: "high",
        title: "Closing-ready flag with overdue coordination requests",
        summary:
          "Deal pipeline is closing_ready but open deal requests are past due. This may block a clean close.",
        reasons: [`Overdue open requests: ${overdueReq}`],
        affectedEntities: [{ type: "deal", id: deal.id }],
        suggestedActions: ["Clear or waive requests per brokerage policy"],
        findingType: "closing_blocker",
      },
    ];
  }

  return [];
}
