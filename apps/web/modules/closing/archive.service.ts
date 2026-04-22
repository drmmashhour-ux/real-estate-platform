import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";
import { logClosingTimeline } from "./closing-timeline.service";

const TAG = "[closing.archive]";

async function buildSnapshot(transactionId: string): Promise<Prisma.InputJsonValue> {
  const tx = await prisma.lecipmSdTransaction.findUnique({
    where: { id: transactionId },
    include: {
      documents: true,
      timelineEvents: { orderBy: { createdAt: "asc" }, take: 500 },
      financialApproval: true,
      signaturePackets: { include: { signers: true } },
      complianceChecks: true,
      parties: true,
      notaryPackage: true,
    },
  });

  if (!tx) throw new Error("Transaction not found for archive");

  return {
    version: 1,
    transactionNumber: tx.transactionNumber,
    exportedAt: new Date().toISOString(),
    transaction: tx,
  } as Prisma.InputJsonValue;
}

/** Immutable legal archive — single LOCKED snapshot per transaction (no updates after creation). */
export async function createTransactionArchive(transactionId: string, dealId: string, actorUserId: string | null) {
  const closingDone = await prisma.lecipmPipelineDealClosing.findFirst({
    where: { transactionId, closingStatus: "COMPLETED" },
  });
  if (!closingDone) {
    throw new Error("Closing must be COMPLETED before legal archive");
  }

  const existing = await prisma.lecipmSdTransactionArchive.findUnique({
    where: { transactionId },
  });
  if (existing) {
    logInfo(TAG, { transactionId, immutable: true });
    return existing;
  }

  const snapshotJson = await buildSnapshot(transactionId);

  const row = await prisma.lecipmSdTransactionArchive.create({
    data: {
      transactionId,
      snapshotJson,
      archiveStatus: "LOCKED",
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "ARCHIVE_CREATED",
    actorUserId,
    summary: `Transaction archive LOCKED (${transactionId})`,
    metadataJson: { archiveId: row.id },
  });

  await logClosingTimeline(transactionId, "ARCHIVE_CREATED", `Archive ${row.id} LOCKED`);

  logInfo(TAG, { archiveId: row.id });
  return row;
}
