import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendDealAuditEvent } from "./deal-audit.service";
import { applyStageAfterCommitteeDecision } from "./deal-stage.service";

const TAG = "[deal.committee]";

export async function submitToCommittee(dealId: string, summary: string, submittedByUserId: string | null) {
  const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error("Deal not found");
  if (deal.pipelineStage === "DECLINED") throw new Error("Deal is declined");

  await prisma.$transaction(async (tx) => {
    await tx.lecipmPipelineDealCommitteeSubmission.create({
      data: {
        dealId,
        submittedByUserId: submittedByUserId ?? undefined,
        summary: summary.slice(0, 8000),
        status: "SUBMITTED",
      },
    });
    await applyStageAfterCommitteeDecision(
      tx,
      dealId,
      deal.pipelineStage,
      "COMMITTEE_REVIEW",
      submittedByUserId,
      "Submitted to committee"
    );
    await appendDealAuditEvent(tx, {
      dealId,
      eventType: "SUBMITTED_TO_COMMITTEE",
      actorUserId: submittedByUserId,
      summary: summary.slice(0, 500),
    });
  });

  logInfo(TAG, { dealId, action: "submit" });
  return getCommitteeSubmission(dealId);
}

export async function getCommitteeSubmission(dealId: string) {
  return prisma.lecipmPipelineDealCommitteeSubmission.findFirst({
    where: { dealId },
    orderBy: { submittedAt: "desc" },
    include: { decisions: { orderBy: { createdAt: "desc" }, take: 3 } },
  });
}

export async function recordCommitteeDecision(input: {
  dealId: string;
  submissionId?: string | null;
  decidedByUserId: string | null;
  recommendation: string;
  rationale: string;
  confidenceLevel?: string | null;
}) {
  const rec = input.recommendation.toUpperCase();
  if (rec === "DECLINE" && !input.rationale.trim()) throw new Error("Decline requires rationale");

  const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: input.dealId } });
  if (!deal) throw new Error("Deal not found");

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const decision = await tx.lecipmPipelineDealCommitteeDecision.create({
      data: {
        dealId: input.dealId,
        submissionId: input.submissionId ?? undefined,
        decidedByUserId: input.decidedByUserId ?? undefined,
        recommendation: rec.slice(0, 40),
        rationale: input.rationale.slice(0, 8000),
        confidenceLevel: input.confidenceLevel?.slice(0, 16) ?? undefined,
      },
    });

    if (input.submissionId) {
      await tx.lecipmPipelineDealCommitteeSubmission.updateMany({
        where: { id: input.submissionId, dealId: input.dealId },
        data: { status: "DECIDED", decidedAt: new Date() },
      });
    }

    let decisionStatus = deal.decisionStatus;
    let nextStage = deal.pipelineStage;

    if (rec === "DECLINE") {
      decisionStatus = "DECLINE";
      nextStage = "DECLINED";
    } else if (rec === "HOLD") {
      decisionStatus = "HOLD";
      nextStage = "ON_HOLD";
    } else if (rec === "PROCEED_WITH_CONDITIONS") {
      decisionStatus = "PROCEED_WITH_CONDITIONS";
      nextStage = "CONDITIONAL_APPROVAL";
    } else if (rec === "PROCEED") {
      await syncConditionsFromTransactionContextWithTx(tx, input.dealId, input.decidedByUserId);
      const criticalOpen = await tx.lecipmPipelineDealCondition.count({
        where: { dealId: input.dealId, priority: "CRITICAL", status: "OPEN" },
      });
      if (criticalOpen > 0) {
        decisionStatus = "PROCEED_WITH_CONDITIONS";
        nextStage = "CONDITIONAL_APPROVAL";
      } else {
        decisionStatus = "PROCEED";
        nextStage = "EXECUTION";
      }
    }

    await tx.lecipmPipelineDeal.update({
      where: { id: input.dealId },
      data: { decisionStatus, pipelineStage: nextStage },
    });

    await tx.lecipmPipelineDealStageHistory.create({
      data: {
        dealId: input.dealId,
        fromStage: deal.pipelineStage,
        toStage: nextStage,
        changedByUserId: input.decidedByUserId ?? undefined,
        reason: input.rationale.slice(0, 2000),
      },
    });

    await appendDealAuditEvent(tx, {
      dealId: input.dealId,
      eventType: "COMMITTEE_DECISION_RECORDED",
      actorUserId: input.decidedByUserId,
      summary: `${rec}: ${input.rationale.slice(0, 200)}`,
      metadataJson: { decisionId: decision.id, recommendation: rec },
    });

    if (rec === "PROCEED_WITH_CONDITIONS" || nextStage === "CONDITIONAL_APPROVAL") {
      await autoGenerateConditionsForDecisionTx(tx, input.dealId, input.decidedByUserId);
    }
  });

  logInfo(TAG, { dealId: input.dealId, recommendation: rec });
  return prisma.lecipmPipelineDeal.findUnique({ where: { id: input.dealId } });
}

async function syncConditionsFromTransactionContextWithTx(
  tx: Prisma.TransactionClient,
  dealId: string,
  actorUserId: string | null
) {
  const deal = await tx.lecipmPipelineDeal.findUnique({ where: { id: dealId } });
  if (!deal?.transactionId) return;

  const { evaluateCompliance } = await import("@/modules/transactions/transaction-compliance.service");
  const evaln = await evaluateCompliance(deal.transactionId, { skipNotarySent: true });
  for (const msg of evaln.blockingIssues.slice(0, 12)) {
    const title = msg.slice(0, 500);
    const dup = await tx.lecipmPipelineDealCondition.findFirst({ where: { dealId, title } });
    if (dup) continue;
    await tx.lecipmPipelineDealCondition.create({
      data: {
        dealId,
        title,
        description: "Derived from transaction compliance evaluation",
        category: "COMPLIANCE",
        priority: "CRITICAL",
        status: "OPEN",
      },
    });
    await appendDealAuditEvent(tx, {
      dealId,
      eventType: "CONDITION_CREATED",
      actorUserId,
      summary: `Condition: ${title}`,
      metadataJson: { source: "transaction_compliance" },
    });
  }
}

async function autoGenerateConditionsForDecisionTx(
  tx: Prisma.TransactionClient,
  dealId: string,
  actorUserId: string | null
) {
  const templates = [
    { title: "Execute signed purchase agreement", category: "DOCUMENT", priority: "CRITICAL" },
    { title: "Final financing approval on file", category: "FINANCIAL", priority: "CRITICAL" },
    { title: "Resolve compliance blockers on transaction file", category: "COMPLIANCE", priority: "CRITICAL" },
    { title: "Notary package ready / sent", category: "NOTARY", priority: "HIGH" },
  ];

  for (const t of templates) {
    await tx.lecipmPipelineDealCondition.create({
      data: {
        dealId,
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: "OPEN",
      },
    });
    await appendDealAuditEvent(tx, {
      dealId,
      eventType: "CONDITION_CREATED",
      actorUserId,
      summary: `Condition: ${t.title}`,
      metadataJson: { template: true },
    });
  }
}

export async function withdrawSubmission(submissionId: string, actorUserId: string | null) {
  const sub = await prisma.lecipmPipelineDealCommitteeSubmission.findUnique({ where: { id: submissionId } });
  if (!sub) throw new Error("Submission not found");

  await prisma.lecipmPipelineDealCommitteeSubmission.update({
    where: { id: submissionId },
    data: { status: "WITHDRAWN" },
  });

  await appendDealAuditEvent(prisma, {
    dealId: sub.dealId,
    eventType: "SUBMITTED_TO_COMMITTEE",
    actorUserId,
    summary: `Committee submission ${submissionId} withdrawn`,
    metadataJson: { submissionId, withdrawn: true },
  });

  return sub;
}
