import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { canStartClosingSession } from "@/modules/closing/closing-policy";
import { appendClosingAudit } from "@/modules/closing/closing-audit";
import { seedDefaultClosingDocuments } from "@/modules/closing/closing-document.service";
import { seedDefaultClosingChecklist } from "@/modules/closing/closing-checklist.service";
import { seedDefaultSignatures } from "@/modules/closing/closing-signature.service";
import { syncDealClosingReadiness, evaluateFinalClosingReadiness } from "@/modules/closing/closing-orchestrator";
import { runPostCloseOnboarding } from "@/modules/closing/postclose-onboarding.service";
import { transitionPipelineState } from "@/modules/execution/execution.service";
import { getLatestCloseProbability } from "@/modules/deal/close-probability.service";
import { recordCloseProbabilityOutcome } from "@/modules/deal/close-probability-learning.service";
import {
  DealConflictConsentBlockedError,
  assertDealConflictConsentAllowsProgress,
} from "@/lib/compliance/conflict-deal-compliance.service";

const TAG = "[closing-room]";

export async function startClosingRoom(options: {
  dealId: string;
  actorUserId: string;
}): Promise<{ closingId: string }> {
  const deal = await prisma.deal.findUnique({
    where: { id: options.dealId },
    select: {
      id: true,
      status: true,
      lecipmExecutionPipelineState: true,
      listingId: true,
    },
  });
  if (!deal) throw new Error("Deal not found");

  const gate = canStartClosingSession(deal);
  if (!gate.ok) throw new Error(gate.reason);

  const existing = await prisma.dealClosing.findUnique({
    where: { dealId: options.dealId },
    select: { id: true, status: true },
  });
  if (existing && existing.status !== "NOT_STARTED" && existing.status !== "FAILED") {
    throw new Error("Closing session already active or completed.");
  }

  const closing = await prisma.dealClosing.upsert({
    where: { dealId: options.dealId },
    create: {
      dealId: options.dealId,
      status: "IN_PROGRESS",
      readinessStatus: "NOT_READY",
    },
    update: {
      status: "IN_PROGRESS",
      readinessStatus: "NOT_READY",
      updatedAt: new Date(),
    },
    select: { id: true },
  });

  await prisma.deal.update({
    where: { id: options.dealId },
    data: { status: "closing_scheduled", updatedAt: new Date() },
  });

  await seedDefaultClosingDocuments(options.dealId);
  await seedDefaultClosingChecklist(options.dealId);
  await seedDefaultSignatures(options.dealId);
  await syncDealClosingReadiness(options.dealId);

  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "STARTED",
    note: "Closing room opened",
    metadataJson: { closingId: closing.id },
  });

  logInfo(`${TAG}`, { dealId: options.dealId, closingId: closing.id });
  return { closingId: closing.id };
}

export async function getClosingRoomDetail(dealId: string) {
  const [deal, closing, docs, checklist, signatures, readiness, latestCloseProbability] = await Promise.all([
    prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        dealCode: true,
        status: true,
        listingId: true,
        priceCents: true,
        lecipmExecutionPipelineState: true,
        buyerId: true,
        sellerId: true,
        brokerId: true,
      },
    }),
    prisma.dealClosing.findUnique({ where: { dealId } }),
    prisma.dealClosingDocument.findMany({ where: { dealId }, orderBy: { category: "asc" } }),
    prisma.dealClosingChecklist.findMany({ where: { dealId }, orderBy: { createdAt: "asc" } }),
    prisma.dealClosingSignature.findMany({ where: { dealId }, orderBy: { createdAt: "asc" } }),
    evaluateFinalClosingReadiness(dealId),
    getLatestCloseProbability(dealId),
  ]);

  return {
    deal,
    closing,
    documents: docs,
    checklist,
    signatures,
    readiness,
    latestCloseProbability: latestCloseProbability
      ? {
          id: latestCloseProbability.id,
          probability: latestCloseProbability.probability,
          category: latestCloseProbability.category,
          drivers: latestCloseProbability.drivers,
          risks: latestCloseProbability.risks,
          createdAt: latestCloseProbability.createdAt.toISOString(),
        }
      : null,
  };
}

export async function confirmClosingExecution(options: {
  dealId: string;
  actorUserId: string;
  closingDate: Date;
  notes?: string | null;
  actionPipelineId?: string | null;
}): Promise<{ assetId: string | null }> {
  const dealCheck = await prisma.deal.findUnique({
    where: { id: options.dealId },
    select: { status: true },
  });
  if (dealCheck?.status === "closed") {
    const a = await prisma.postCloseAsset.findUnique({
      where: { dealId: options.dealId },
      select: { id: true },
    });
    return { assetId: a?.id ?? null };
  }

  try {
    await assertDealConflictConsentAllowsProgress(options.dealId);
  } catch (e) {
    if (e instanceof DealConflictConsentBlockedError) throw new Error(e.message);
    throw e;
  }

  const readiness = await evaluateFinalClosingReadiness(options.dealId);
  if (readiness.readinessStatus !== "READY") {
    throw new Error("Closing cannot be confirmed until readiness is READY.");
  }

  const closing = await prisma.dealClosing.findUnique({
    where: { dealId: options.dealId },
    select: { id: true, status: true },
  });
  if (!closing || closing.status === "CLOSED") {
    throw new Error("Invalid closing session state.");
  }

  await prisma.dealClosing.update({
    where: { dealId: options.dealId },
    data: {
      status: "CLOSED",
      closingDate: options.closingDate,
      confirmedByUserId: options.actorUserId,
      notes: options.notes ?? null,
      updatedAt: new Date(),
    },
  });

  await prisma.deal.update({
    where: { id: options.dealId },
    data: { status: "closed", updatedAt: new Date() },
  });

  void recordCloseProbabilityOutcome(options.dealId, true).catch(() => {});
  void recordNegotiationStrategyOutcome(options.dealId, true).catch(() => {});

  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "CLOSED",
    note: options.notes ?? "Closing confirmed",
    metadataJson: { closingDate: options.closingDate.toISOString() },
  });

  const tr = await transitionPipelineState({
    dealId: options.dealId,
    to: "closed",
    actorUserId: options.actorUserId,
    reason: "closing_confirmed" as const,
    actionPipelineId: options.actionPipelineId,
  });
  if (!tr.ok) {
    logInfo(`${TAG}`, { dealId: options.dealId, pipelineWarn: tr.message });
  }

  const assetId = await runPostCloseOnboarding({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    closingDate: options.closingDate,
  });

  logInfo(`${TAG}`, { dealId: options.dealId, confirmed: true, assetId });
  return { assetId };
}
