import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendCapitalAudit } from "@/modules/capital/capital-audit";

const TAG = "[lender-workflow]";

const VALID_STATUSES = new Set([
  "TARGET",
  "CONTACTED",
  "REVIEWING",
  "INTERESTED",
  "DECLINED",
  "OFFER_RECEIVED",
  "CLOSED",
]);

export async function addPipelineLender(options: {
  pipelineDealId: string;
  actorUserId: string;
  name: string;
  lenderType?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
}): Promise<{ id: string }> {
  const row = await prisma.investmentPipelineLender.create({
    data: {
      pipelineDealId: options.pipelineDealId,
      name: options.name,
      lenderType: options.lenderType ?? null,
      contactName: options.contactName ?? null,
      contactEmail: options.contactEmail ?? null,
      notes: options.notes ?? null,
      status: "TARGET",
    },
    select: { id: true },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "LENDER_ADDED",
    note: options.name,
    metadataJson: { lenderId: row.id },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, lenderId: row.id });
  return row;
}

export async function updateLenderStatus(options: {
  pipelineDealId: string;
  lenderId: string;
  actorUserId: string;
  status: string;
  notes?: string | null;
}): Promise<void> {
  if (!VALID_STATUSES.has(options.status)) {
    throw new Error(`Invalid lender status: ${options.status}`);
  }

  const lender = await prisma.investmentPipelineLender.findFirst({
    where: { id: options.lenderId, pipelineDealId: options.pipelineDealId },
    select: { id: true, status: true, notes: true },
  });
  if (!lender) throw new Error("Lender not found");

  await prisma.investmentPipelineLender.update({
    where: { id: lender.id },
    data: {
      status: options.status,
      notes:
        options.notes != null ? options.notes
        : lender.notes ?
          lender.notes
        : null,
      updatedAt: new Date(),
    },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "LENDER_STATUS_CHANGED",
    note: `${lender.status} → ${options.status}`,
    metadataJson: { lenderId: options.lenderId, from: lender.status, to: options.status },
  });

  logInfo(`${TAG}`, {
    pipelineDealId: options.pipelineDealId,
    lenderId: options.lenderId,
    status: options.status,
  });
}

export async function attachLenderNotes(options: {
  pipelineDealId: string;
  lenderId: string;
  actorUserId: string;
  notes: string;
}): Promise<void> {
  const lender = await prisma.investmentPipelineLender.findFirst({
    where: { id: options.lenderId, pipelineDealId: options.pipelineDealId },
    select: { id: true },
  });
  if (!lender) throw new Error("Lender not found");

  await prisma.investmentPipelineLender.update({
    where: { id: lender.id },
    data: { notes: options.notes, updatedAt: new Date() },
  });

  await appendCapitalAudit({
    pipelineDealId: options.pipelineDealId,
    actorUserId: options.actorUserId,
    eventType: "LENDER_NOTES_UPDATED",
    note: "Notes updated",
    metadataJson: { lenderId: options.lenderId },
  });

  logInfo(`${TAG}`, { pipelineDealId: options.pipelineDealId, lenderId: options.lenderId });
}

export async function listPipelineLenders(pipelineDealId: string) {
  return prisma.investmentPipelineLender.findMany({
    where: { pipelineDealId },
    orderBy: { updatedAt: "desc" },
  });
}
