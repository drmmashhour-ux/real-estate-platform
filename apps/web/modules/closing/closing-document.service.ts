import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendClosingAudit } from "@/modules/closing/closing-audit";
import { syncDealClosingReadiness } from "@/modules/closing/closing-orchestrator";

const TAG = "[closing-document]";

const DEFAULT_DOCS: Array<{ title: string; category: string; required: boolean }> = [
  { title: "Purchase agreement (final executed)", category: "LEGAL", required: true },
  { title: "Financing agreements", category: "FINANCING", required: true },
  { title: "Lender closing instructions / undertakings", category: "FINANCING", required: true },
  { title: "Insurance certificate(s) — effective at closing", category: "INSURANCE", required: true },
  { title: "Title / deed evidence (or notarial act reference)", category: "TITLE", required: true },
  { title: "Corporate authority & resolutions (if applicable)", category: "CORPORATE", required: true },
  { title: "ESG / disclosure pack (where material)", category: "ESG", required: false },
  { title: "Closing statement / adjustments", category: "LEGAL", required: true },
];

export async function seedDefaultClosingDocuments(dealId: string): Promise<number> {
  const existing = await prisma.dealClosingDocument.count({ where: { dealId } });
  if (existing > 0) return 0;

  await prisma.$transaction(async (tx) => {
    for (const d of DEFAULT_DOCS) {
      await tx.dealClosingDocument.create({
        data: {
          dealId,
          title: d.title,
          category: d.category,
          required: d.required,
          status: "MISSING",
        },
      });
    }
  });

  logInfo(`${TAG}`, { dealId, seeded: DEFAULT_DOCS.length });
  return DEFAULT_DOCS.length;
}

export async function registerClosingDocumentUpload(options: {
  dealId: string;
  actorUserId: string;
  title?: string;
  category?: string;
  fileUrl: string;
  documentId?: string;
  required?: boolean;
}): Promise<{ id: string }> {
  if (!options.fileUrl.trim()) throw new Error("fileUrl required");

  if (options.documentId) {
    const exists = await prisma.dealClosingDocument.findFirst({
      where: { id: options.documentId, dealId: options.dealId },
      select: { id: true },
    });
    if (!exists) throw new Error("Document not found for this deal.");

    const updated = await prisma.dealClosingDocument.update({
      where: { id: exists.id },
      data: {
        fileUrl: options.fileUrl,
        status: "UPLOADED",
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    await appendClosingAudit({
      dealId: options.dealId,
      actorUserId: options.actorUserId,
      eventType: "DOCUMENT_UPLOADED",
      note: updated.id,
      metadataJson: { documentId: updated.id },
    });
    await syncDealClosingReadiness(options.dealId);

    logInfo(`${TAG}`, { dealId: options.dealId, documentId: updated.id });
    return updated;
  }

  const row = await prisma.dealClosingDocument.create({
    data: {
      dealId: options.dealId,
      title: options.title ?? "Uploaded document",
      category: options.category ?? "OTHER",
      fileUrl: options.fileUrl,
      status: "UPLOADED",
      required: options.required ?? false,
    },
    select: { id: true },
  });

  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "DOCUMENT_UPLOADED",
    note: row.id,
    metadataJson: {},
  });
  await syncDealClosingReadiness(options.dealId);

  return row;
}

export async function verifyClosingDocument(options: {
  dealId: string;
  documentId: string;
  actorUserId: string;
}): Promise<void> {
  const doc = await prisma.dealClosingDocument.findFirst({
    where: { id: options.documentId, dealId: options.dealId },
    select: { id: true },
  });
  if (!doc) throw new Error("Document not found for this deal.");

  await prisma.dealClosingDocument.update({
    where: { id: doc.id },
    data: {
      status: "VERIFIED",
      verifiedByUserId: options.actorUserId,
      updatedAt: new Date(),
    },
  });

  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "DOCUMENT_VERIFIED",
    note: options.documentId,
    metadataJson: {},
  });
  await syncDealClosingReadiness(options.dealId);
  logInfo(`${TAG}`, { dealId: options.dealId, documentId: options.documentId, verified: true });
}

export async function rejectClosingDocument(options: {
  dealId: string;
  documentId: string;
  actorUserId: string;
  notes?: string | null;
}): Promise<void> {
  const doc = await prisma.dealClosingDocument.findFirst({
    where: { id: options.documentId, dealId: options.dealId },
    select: { id: true },
  });
  if (!doc) throw new Error("Document not found for this deal.");

  await prisma.dealClosingDocument.update({
    where: { id: doc.id },
    data: {
      status: "REJECTED",
      notes: options.notes ?? null,
      updatedAt: new Date(),
    },
  });

  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "DOCUMENT_REJECTED",
    note: options.documentId,
    metadataJson: { notes: options.notes ?? null },
  });
  await syncDealClosingReadiness(options.dealId);
  logInfo(`${TAG}`, { dealId: options.dealId, documentId: options.documentId, rejected: true });
}
