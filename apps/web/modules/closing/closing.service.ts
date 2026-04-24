import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { assertAutopilotOutboundAllowed } from "@/lib/signature-control/autopilot-guard";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";
import { logTimelineEvent } from "@/modules/transactions/transaction-timeline.service";
import { createAssetFromDeal } from "./asset-onboarding.service";
import { createTransactionArchive } from "./archive.service";
import { createDefaultChecklistItems } from "./closing-checklist.service";
import { evaluateClosing } from "./closing-validation.service";
import { logClosingTimeline } from "./closing-timeline.service";

const TAG = "[closing.room]";

export async function getClosingByDealId(dealId: string) {
  return prisma.lecipmPipelineDealClosing.findUnique({
    where: { dealId },
    include: {
      checklistItems: { orderBy: { label: "asc" } },
      closingDocuments: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function initializeClosing(dealId: string, actorUserId: string | null) {
  const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error("Deal not found");

  if (deal.pipelineStage !== "EXECUTION" && deal.pipelineStage !== "APPROVED") {
    throw new Error("Deal must be APPROVED or EXECUTION to initialize closing");
  }
  if (!deal.transactionId) throw new Error("Deal must have a linked SD transaction");

  const dup = await prisma.lecipmPipelineDealClosing.findUnique({ where: { dealId } });
  if (dup) throw new Error("Closing room already initialized");

  const notary = await prisma.lecipmSdNotaryPackage.findUnique({
    where: { transactionId: deal.transactionId },
  });

  const closing = await prisma.lecipmPipelineDealClosing.create({
    data: {
      dealId,
      transactionId: deal.transactionId,
      closingStatus: "PREPARING",
      notaryName: notary?.notaryName ?? undefined,
      notaryEmail: notary?.notaryEmail ?? undefined,
    },
  });

  await createDefaultChecklistItems(closing.id, deal.transactionId);

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "CLOSING_INITIALIZED",
    actorUserId,
    summary: "Closing room initialized",
    metadataJson: { closingId: closing.id },
  });
  await logClosingTimeline(deal.transactionId, "CLOSING_INITIALIZED", `Deal ${deal.dealNumber}`);

  logInfo(TAG, { dealId, closingId: closing.id });
  return getClosingByDealId(dealId);
}

export async function assignNotary(dealId: string, name: string, email: string | null, actorUserId: string | null) {
  const closing = await prisma.lecipmPipelineDealClosing.findUnique({ where: { dealId } });
  if (!closing?.transactionId) throw new Error("Closing not found or no transaction");

  await prisma.lecipmPipelineDealClosing.update({
    where: { dealId },
    data: {
      notaryName: name.slice(0, 256),
      notaryEmail: email?.slice(0, 320) ?? undefined,
    },
  });

  await prisma.lecipmSdNotaryPackage.upsert({
    where: { transactionId: closing.transactionId },
    create: {
      transactionId: closing.transactionId,
      notaryName: name.slice(0, 256),
      notaryEmail: email?.slice(0, 320) ?? undefined,
    },
    update: {
      notaryName: name.slice(0, 256),
      notaryEmail: email?.slice(0, 320) ?? undefined,
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "NOTARY_ASSIGNED",
    actorUserId,
    summary: `Notary: ${name}`,
  });
  await logClosingTimeline(closing.transactionId, "NOTARY_ASSIGNED", name);

  return getClosingByDealId(dealId);
}

export async function prepareFinalDocumentSet(dealId: string, actorUserId: string | null) {
  const closing = await prisma.lecipmPipelineDealClosing.findUnique({
    where: { dealId },
    include: { closingDocuments: true },
  });
  if (!closing) throw new Error("Closing not found");

  for (const d of closing.closingDocuments) {
    if (d.status === "PENDING") {
      await prisma.lecipmPipelineDealClosingDocument.update({
        where: { id: d.id },
        data: { status: "READY" },
      });
    }
  }

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "NOTARY_PACKAGE_READY",
    actorUserId,
    summary: "Closing documents marked READY",
  });
  await logClosingTimeline(closing.transactionId, "NOTARY_PACKAGE_READY", "Final document set prepared");

  return getClosingByDealId(dealId);
}

/** Marks closing READY and logs package sent (simulated). */
export async function simulateSendToNotary(
  dealId: string,
  actorUserId: string | null,
  actionPipelineId?: string | null,
) {
  await assertAutopilotOutboundAllowed({
    operation: "sd_closing:simulate_send_notary",
    actionPipelineId,
  });

  const closing = await prisma.lecipmPipelineDealClosing.findUnique({ where: { dealId } });
  if (!closing) throw new Error("Closing not found");

  await prisma.lecipmPipelineDealClosing.update({
    where: { dealId },
    data: { closingStatus: "READY" },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "NOTARY_PACKAGE_SENT_SIMULATED",
    actorUserId,
    summary: "Simulated send to notary",
  });
  await logClosingTimeline(closing.transactionId, "NOTARY_PACKAGE_READY", "Package ready for notary execution");

  return getClosingByDealId(dealId);
}

export async function markSigningStarted(dealId: string, actorUserId: string | null) {
  const closing = await prisma.lecipmPipelineDealClosing.findUnique({ where: { dealId } });
  if (!closing) throw new Error("Closing not found");

  await prisma.lecipmPipelineDealClosing.update({
    where: { dealId },
    data: { closingStatus: "SIGNING" },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "NOTARY_SIGNING_STARTED",
    actorUserId,
    summary: "Signing session started",
  });
  await logClosingTimeline(closing.transactionId, "NOTARY_SIGNING_STARTED", "Notary signing");

  return getClosingByDealId(dealId);
}

export async function completeClosing(
  dealId: string,
  actorUserId: string | null,
  actionPipelineId?: string | null,
) {
  await assertAutopilotOutboundAllowed({
    operation: "sd_closing:complete",
    actionPipelineId,
  });

  const validation = await evaluateClosing(dealId);
  if (validation.status !== "READY") {
    throw new Error(validation.issues.join("; ") || "Closing validation failed");
  }

  const deal = await prisma.lecipmPipelineDeal.findUnique({ where: { id: dealId } });
  if (!deal?.transactionId) throw new Error("Missing transaction on deal");

  const closing = await prisma.lecipmPipelineDealClosing.findUnique({ where: { dealId } });
  if (!closing) throw new Error("Closing not initialized");

  const now = new Date();

  await prisma.lecipmPipelineDealClosing.update({
    where: { dealId },
    data: {
      closingStatus: "COMPLETED",
      closingDate: now,
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "TRANSACTION_CLOSED",
    actorUserId,
    summary: `Transaction closed ${deal.transactionNumber ?? deal.transactionId}`,
    metadataJson: { transactionId: deal.transactionId },
  });

  await logTimelineEvent(prisma, deal.transactionId, "TRANSACTION_CLOSED", `Deal ${deal.dealNumber} closed`);

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "DEAL_CLOSED",
    actorUserId,
    summary: "Pipeline deal closed",
  });

  await createAssetFromDeal(dealId, actorUserId);
  await createTransactionArchive(deal.transactionId, dealId, actorUserId);

  logInfo(TAG, { dealId, closed: true });
  return getClosingByDealId(dealId);
}

/** @deprecated Use `confirmClosingExecution` from `closing-room.service` for LECIPm `Deal` closing. */
export const confirmDealClosing = completeClosing;
