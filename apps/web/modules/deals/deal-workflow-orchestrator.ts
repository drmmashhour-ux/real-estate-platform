import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { PipelineStage } from "@/modules/deals/deal.types";
import { assertStageTransitionAllowed, logStageCheck } from "@/modules/deals/deal-stage-engine";

const TAG = "[deal-pipeline]";

export async function countCriticalOpenConditions(dealId: string): Promise<number> {
  return prisma.investmentPipelineCondition.count({
    where: {
      dealId,
      priority: "CRITICAL",
      status: { in: ["OPEN", "IN_PROGRESS", "FAILED"] },
    },
  });
}

export async function buildGateContext(dealId: string): Promise<Parameters<typeof assertStageTransitionAllowed>[2]> {
  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: dealId },
    select: {
      listingId: true,
      latestMemoId: true,
      latestIcPackId: true,
      pipelineStage: true,
    },
  });
  const submission = await prisma.investmentPipelineCommitteeSubmission.findFirst({
    where: {
      dealId,
      submissionStatus: { in: ["SUBMITTED", "REVIEWING"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const criticalConditionsOpen = await countCriticalOpenConditions(dealId);

  return {
    hasListing: Boolean(deal?.listingId),
    hasMemo: Boolean(deal?.latestMemoId),
    hasIcPack: Boolean(deal?.latestIcPackId),
    hasCommitteeSubmission: Boolean(submission),
    hasActiveSubmission: Boolean(submission),
    criticalConditionsOpen,
  };
}

/** After condition / diligence updates — optionally advance toward APPROVED when safe. */
export async function reconcileAfterArtifactsUpdate(dealId: string, actorUserId?: string | null): Promise<void> {
  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: dealId },
    select: { pipelineStage: true, decisionStatus: true },
  });
  if (!deal) return;

  const gate = await buildGateContext(dealId);

  if (
    deal.pipelineStage === "CONDITIONAL_APPROVAL" &&
    deal.decisionStatus === "PROCEED_WITH_CONDITIONS" &&
    gate.criticalConditionsOpen === 0
  ) {
    const check = assertStageTransitionAllowed(
      deal.pipelineStage as PipelineStage,
      "APPROVED",
      gate
    );
    logStageCheck(dealId, deal.pipelineStage as PipelineStage, "APPROVED", check);
    if (check.ok) {
      await prisma.investmentPipelineDeal.update({
        where: { id: dealId },
        data: {
          pipelineStage: "APPROVED",
          status: "APPROVED",
          updatedAt: new Date(),
        },
      });
      await prisma.investmentPipelineDealStageHistory.create({
        data: {
          dealId,
          fromStage: deal.pipelineStage,
          toStage: "APPROVED",
          changedByUserId: actorUserId ?? null,
          reason: "All critical conditions cleared — workflow reconciliation.",
        },
      });
      await prisma.investmentPipelineDecisionAudit.create({
        data: {
          dealId,
          actorUserId: actorUserId ?? null,
          eventType: "STAGE_CHANGED",
          note: "Moved to APPROVED after critical conditions resolved.",
          metadataJson: {},
        },
      });
      logInfo(`${TAG} reconciled → APPROVED`, { dealId });
    }
  }
}
