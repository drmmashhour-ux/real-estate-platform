import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { CommitteeRecommendation, PipelineStage } from "@/modules/deals/deal.types";
import { buildStructuredDecisionRecord, type CommitteeDecisionPayload } from "@/modules/deals/deal-decision-log.service";
import { createCondition } from "@/modules/deals/deal-conditions.service";
import { createFollowUpsForDecision } from "@/modules/deals/deal-followup.service";
import { assertStageTransitionAllowed, logStageCheck } from "@/modules/deals/deal-stage-engine";
import { buildGateContext, countCriticalOpenConditions } from "@/modules/deals/deal-workflow-orchestrator";
import { userCanRecordCommitteeDecision } from "@/modules/deals/deal-access";
import { applyPipelineStage } from "@/modules/deals/deal-pipeline.service";

const TAG = "[deal-committee]";

export async function submitToCommittee(dealId: string, actorUserId: string): Promise<{ submissionId: string }> {
  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: dealId },
    select: {
      listingId: true,
      latestMemoId: true,
      latestIcPackId: true,
      pipelineStage: true,
    },
  });
  if (!deal) throw new Error("Deal not found");

  if (!deal.latestMemoId || !deal.latestIcPackId) {
    throw new Error("Committee submission requires investor memo and IC pack on file.");
  }

  const memo = await prisma.investorMemo.findUnique({
    where: { id: deal.latestMemoId },
    select: { listingId: true },
  });
  const ic = await prisma.investorIcPack.findUnique({
    where: { id: deal.latestIcPackId },
    select: { listingId: true },
  });
  if (deal.listingId && (memo?.listingId !== deal.listingId || ic?.listingId !== deal.listingId)) {
    throw new Error("Latest memo / IC pack must match the deal listing.");
  }

  const submission = await prisma.investmentPipelineCommitteeSubmission.create({
    data: {
      dealId,
      submittedByUserId: actorUserId,
      memoId: deal.latestMemoId,
      icPackId: deal.latestIcPackId,
      submissionStatus: "SUBMITTED",
    },
    select: { id: true },
  });

  await prisma.investmentPipelineDecisionAudit.create({
    data: {
      dealId,
      actorUserId,
      eventType: "SUBMITTED_TO_COMMITTEE",
      note: "Submission created",
      metadataJson: { submissionId: submission.id },
    },
  });

  const gate = { ...(await buildGateContext(dealId)), hasCommitteeSubmission: true, hasActiveSubmission: true };

  const wantsPrep =
    deal.pipelineStage === "SOURCED" ||
    deal.pipelineStage === "SCREENING" ||
    deal.pipelineStage === "PRELIMINARY_REVIEW";

  const nextStage: PipelineStage = wantsPrep ? "IC_PREP" : "IC_REVIEW";
  const check = assertStageTransitionAllowed(deal.pipelineStage as PipelineStage, nextStage, gate);
  logStageCheck(dealId, deal.pipelineStage as PipelineStage, nextStage, check);
  if (!check.ok) throw new Error(check.reason ?? "Stage blocked");

  await prisma.investmentPipelineDeal.update({
    where: { id: dealId },
    data: { pipelineStage: nextStage, updatedAt: new Date() },
  });

  await prisma.investmentPipelineDealStageHistory.create({
    data: {
      dealId,
      fromStage: deal.pipelineStage,
      toStage: nextStage,
      changedByUserId: actorUserId,
      reason: "Submitted to committee",
    },
  });

  logInfo(`${TAG} submit`, { dealId, submissionId: submission.id });
  return { submissionId: submission.id };
}

export async function recordCommitteeDecision(options: {
  dealId: string;
  submissionId?: string | null;
  actorUserId: string;
  payload: CommitteeDecisionPayload;
}): Promise<void> {
  if (!(await userCanRecordCommitteeDecision(options.actorUserId))) throw new Error("Forbidden");

  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: options.dealId },
    select: { pipelineStage: true, listingId: true },
  });
  if (!deal) throw new Error("Deal not found");

  const rationale = options.payload.rationale.trim();
  if (!rationale) throw new Error("Decision requires rationale.");

  const recommendation = options.payload.recommendation as CommitteeRecommendation;

  const decisionJson = buildStructuredDecisionRecord(options.payload);

  await prisma.investmentPipelineCommitteeDecision.create({
    data: {
      dealId: options.dealId,
      submissionId: options.submissionId ?? null,
      decidedByUserId: options.actorUserId,
      recommendation,
      rationale,
      confidenceLevel: options.payload.confidenceLevel ?? null,
      decisionJson,
    },
  });

  await prisma.investmentPipelineCommitteeSubmission.updateMany({
    where: { dealId: options.dealId, submissionStatus: { in: ["SUBMITTED", "REVIEWING"] } },
    data: { submissionStatus: "DECIDED" },
  });

  await prisma.investmentPipelineDeal.update({
    where: { id: options.dealId },
    data: {
      decisionStatus:
        recommendation === "DECLINE" ? "DECLINE"
        : recommendation === "HOLD" ? "HOLD"
        : recommendation === "PROCEED_WITH_CONDITIONS" ? "PROCEED_WITH_CONDITIONS"
        : recommendation === "PROCEED" ? "PROCEED"
        : "PENDING",
      headlineRecommendation: recommendation,
      confidenceLevel: options.payload.confidenceLevel ?? null,
      updatedAt: new Date(),
    },
  });

  await prisma.investmentPipelineDecisionAudit.create({
    data: {
      dealId: options.dealId,
      actorUserId: options.actorUserId,
      eventType: "DECISION_RECORDED",
      note: rationale.slice(0, 1500),
      metadataJson: { recommendation },
    },
  });

  const hints =
    options.payload.requiredConditions ??
    ((decisionJson as { requiredConditionsHints?: string[] }).requiredConditionsHints ?? []);

  if (recommendation === "PROCEED_WITH_CONDITIONS") {
    const titles = hints.length > 0 ? hints : ["Resolve committee conditions from diligence plan"];
    for (const title of titles.slice(0, 15)) {
      await createCondition({
        dealId: options.dealId,
        title: typeof title === "string" ? title.slice(0, 512) : String(title),
        category: "COMMITTEE",
        priority: "HIGH",
      });
    }
    await applyPipelineStage({
      dealId: options.dealId,
      toStage: "CONDITIONAL_APPROVAL",
      actorUserId: options.actorUserId,
      reason: `Committee: ${recommendation}`,
    });
  } else if (recommendation === "HOLD") {
    await applyPipelineStage({
      dealId: options.dealId,
      toStage: "ON_HOLD",
      actorUserId: options.actorUserId,
      reason: "Committee hold",
    });
  } else if (recommendation === "DECLINE") {
    await applyPipelineStage({
      dealId: options.dealId,
      toStage: "DECLINED",
      actorUserId: options.actorUserId,
      reason: rationale.slice(0, 500),
    });
  } else if (recommendation === "PROCEED") {
    const critical = await countCriticalOpenConditions(options.dealId);
    const target: PipelineStage = critical > 0 ? "CONDITIONAL_APPROVAL" : "APPROVED";
    const gate = await buildGateContext(options.dealId);
    const check = assertStageTransitionAllowed(deal.pipelineStage as PipelineStage, target, gate);
    logStageCheck(options.dealId, deal.pipelineStage as PipelineStage, target, check);
    if (!check.ok) {
      throw new Error(check.reason ?? "Stage transition not allowed for PROCEED decision.");
    }
    await applyPipelineStage({
      dealId: options.dealId,
      toStage: target,
      actorUserId: options.actorUserId,
      reason: `Committee proceed → ${target}`,
    });
  }

  await createFollowUpsForDecision({
    dealId: options.dealId,
    recommendation,
    actorUserId: options.actorUserId,
  });

  logInfo(`${TAG} decision`, { dealId: options.dealId, recommendation });
}
