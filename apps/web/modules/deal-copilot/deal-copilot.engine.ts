import type { Deal, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dealExecutionFlags } from "@/config/feature-flags";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { runContractIntelligence } from "../contract-intelligence/contract-intelligence.engine";
import { suggestWorkflowPackage } from "../form-packages/workflow-matcher.service";
import { copilotHeaderDisclaimer } from "./deal-copilot.explainer";
import type { DealCopilotCard } from "./deal-copilot.types";

function mapIssueToType(t: string): DealCopilotCard["type"] {
  if (t === "clause_suggestion") return "clause_suggestion";
  if (t === "inconsistency") return "inconsistency_warning";
  if (t === "missing_field") return "missing_field_warning";
  if (t === "deadline_order") return "deadline_warning";
  if (t === "risk_prompt") return "annex_recommendation";
  return "review_required";
}

function severityRank(s: string): number {
  if (s === "critical") return 3;
  if (s === "warning") return 2;
  return 1;
}

/**
 * Runs copilot pipeline and persists suggestions for broker review (replaces prior pending batch).
 */
export async function runDealCopilotEngine(deal: Deal, actorUserId: string): Promise<{
  cards: DealCopilotCard[];
  workflowHint: ReturnType<typeof suggestWorkflowPackage>;
  disclaimer: string;
}> {
  if (!dealExecutionFlags.dealExecutionCopilotV1) {
    return {
      cards: [],
      workflowHint: suggestWorkflowPackage(deal),
      disclaimer: "Deal execution copilot is disabled.",
    };
  }

  const ci = await runContractIntelligence(deal);
  const workflowHint = suggestWorkflowPackage(deal);

  const cards: DealCopilotCard[] = ci.issues.map((issue) => ({
    type: mapIssueToType(issue.issueType),
    title: issue.title,
    summary: issue.summary,
    confidence: issue.severity === "critical" ? 0.85 : issue.severity === "warning" ? 0.65 : 0.45,
    severity: issue.severity,
    reasons: issue.explanation,
    recommendedAction: issue.suggestedFix ?? "Review and decide in brokerage workflow.",
    linkedFields: issue.affectedFieldKeys,
  }));

  cards.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  await prisma.$transaction(async (tx) => {
    await tx.dealCopilotSuggestion.deleteMany({
      where: { dealId: deal.id, status: "pending" },
    });

    if (cards.length) {
      await tx.dealCopilotSuggestion.createMany({
        data: cards.map((c) => ({
          dealId: deal.id,
          suggestionType: c.type,
          title: c.title,
          summary: c.summary,
          confidence: c.confidence,
          severity: c.severity,
          reasons: c.reasons as Prisma.InputJsonValue,
          recommendedAction: c.recommendedAction,
          linkedFields: c.linkedFields ? (c.linkedFields as Prisma.InputJsonValue) : undefined,
          brokerReviewRequired: true,
          status: "pending",
          sourceAttribution: {
            engine: "deal_copilot_v1",
            workflowPackage: workflowHint.packageKey,
          } as Prisma.InputJsonValue,
        })),
      });
    }

    await tx.dealExecutionAuditLog.create({
      data: {
        dealId: deal.id,
        actorUserId,
        actionKey: "copilot_run",
        payload: {
          issueCount: cards.length,
          workflowHint: workflowHint.packageKey,
        } as Prisma.InputJsonValue,
      },
    });
  });

  await logDealExecutionEvent({
    eventType: "clause_suggestion_generated",
    userId: actorUserId,
    dealId: deal.id,
    metadata: { count: cards.length },
  });

  return {
    cards,
    workflowHint,
    disclaimer: `${copilotHeaderDisclaimer()} ${ci.disclaimer}`,
  };
}
