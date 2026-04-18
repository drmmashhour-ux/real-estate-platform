import { prisma } from "@/lib/db";
import type { ComplianceRuleHit } from "./compliance-rules.types";

export async function runDocumentRules(dealId: string): Promise<ComplianceRuleHit[]> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      lecipmExecutionPipelineState: true,
      documents: {
        select: { id: true, workflowStatus: true, type: true },
      },
    },
  });
  if (!deal) return [];

  const out: ComplianceRuleHit[] = [];
  const draftOrNull = deal.documents.filter((d) => !d.workflowStatus || d.workflowStatus === "draft");

  if (
    (deal.lecipmExecutionPipelineState === "broker_approved" || deal.lecipmExecutionPipelineState === "ready_for_execution") &&
    draftOrNull.length > 0
  ) {
    out.push({
      ruleKey: "document.pipeline_ahead_of_document_review",
      caseType: "document_inconsistency",
      severity: "high",
      title: "Execution pipeline advanced while documents remain in draft",
      summary:
        "At least one deal document is still in draft (or unset workflow) while the execution pipeline indicates broker-approved or ready-for-execution. Confirm review gates.",
      reasons: [
        `Pipeline: ${deal.lecipmExecutionPipelineState ?? "null"}`,
        `Draft/unset documents: ${draftOrNull.length}`,
      ],
      affectedEntities: draftOrNull.slice(0, 5).map((d) => ({ type: "deal_document", id: d.id })),
      suggestedActions: ["Reconcile workflow status with broker review policy"],
      findingType: "workflow_misalignment",
    });
  }

  const inBrokerReview = deal.documents.filter((d) => d.workflowStatus === "broker_review").length;
  if (inBrokerReview >= 5) {
    out.push({
      ruleKey: "document.backlog_broker_review",
      caseType: "document_inconsistency",
      severity: "medium",
      title: "Large broker-review document backlog",
      summary: `${inBrokerReview} documents are marked broker_review for this deal.`,
      reasons: ["High concurrent broker_review count"],
      affectedEntities: [{ type: "deal", id: deal.id }],
      suggestedActions: ["Prioritize review queue"],
      findingType: "review_backlog",
    });
  }

  return out;
}
