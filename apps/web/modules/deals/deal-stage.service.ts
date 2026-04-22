import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appendDealAuditEvent } from "./deal-audit.service";

export async function transitionPipelineStage(input: {
  dealId: string;
  toStage: string;
  actorUserId: string | null;
  reason?: string | null;
}) {
  const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: input.dealId } });
  if (!deal) throw new Error("Deal not found");

  const from = deal.pipelineStage;
  const to = input.toStage.slice(0, 40);
  if (from === to) return deal;

  await assertStageTransitionAllowed(deal.id, from, to);

  await prisma.$transaction(async (tx) => {
    await tx.lecipmPipelineDeal.update({
      where: { id: input.dealId },
      data: { pipelineStage: to },
    });
    await tx.lecipmPipelineDealStageHistory.create({
      data: {
        dealId: input.dealId,
        fromStage: from,
        toStage: to,
        changedByUserId: input.actorUserId ?? undefined,
        reason: input.reason?.slice(0, 8000) ?? undefined,
      },
    });
    await appendDealAuditEvent(tx, {
      dealId: input.dealId,
      eventType: "STAGE_CHANGED",
      actorUserId: input.actorUserId,
      summary: `${from} → ${to}`,
      metadataJson: { from, to },
    });
  });

  return prisma.lecipmPipelineDeal.findUnique({ where: { id: input.dealId } });
}

async function assertStageTransitionAllowed(dealId: string, from: string, to: string) {
  if (to === "COMMITTEE_REVIEW") {
    const sub = await prisma.lecipmPipelineDealCommitteeSubmission.findFirst({
      where: {
        dealId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
    });
    if (!sub) throw new Error("Committee submission required before COMMITTEE_REVIEW");
  }

  if (to === "APPROVED") {
    const criticalOpen = await prisma.lecipmPipelineDealCondition.count({
      where: { dealId, priority: "CRITICAL", status: "OPEN" },
    });
    if (criticalOpen > 0) throw new Error("Cannot move to APPROVED while critical conditions are OPEN");
  }

  if (to === "DECLINED" && from !== "DECLINED") {
    throw new Error("Pipeline decline must include committee rationale — use committee decision endpoint");
  }
}

/** Internal: set stage without COMMITTEE_REVIEW submission check (committee decision already validated). */
export async function applyStageAfterCommitteeDecision(
  tx: Prisma.TransactionClient,
  dealId: string,
  fromStage: string,
  toStage: string,
  actorUserId: string | null,
  reason: string
) {
  await tx.lecipmPipelineDeal.update({
    where: { id: dealId },
    data: { pipelineStage: toStage.slice(0, 40) },
  });
  await tx.lecipmPipelineDealStageHistory.create({
    data: {
      dealId,
      fromStage: fromStage,
      toStage: toStage.slice(0, 40),
      changedByUserId: actorUserId ?? undefined,
      reason: reason.slice(0, 8000),
    },
  });
  await appendDealAuditEvent(tx, {
    dealId,
    eventType: "STAGE_CHANGED",
    actorUserId,
    summary: `${fromStage} → ${toStage}`,
    metadataJson: { from: fromStage, to: toStage },
  });
}
