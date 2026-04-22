import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";
import type { ClosingDocType } from "./closing.types";
import { logClosingTimeline } from "./closing-timeline.service";

const TAG = "[closing.document]";
const FINAL_STATUSES = new Set(["FINAL", "SIGNED"]);

function mapSdDocumentTypeToClosing(dt: string): ClosingDocType | "OTHER" {
  const u = dt.toUpperCase();
  if (u.includes("DEED")) return "FINAL_DEED";
  if (u.includes("MORTGAGE")) return "MORTGAGE";
  if (u.includes("DISCLOSURE")) return "DISCLOSURE";
  if (u.includes("TRANSFER")) return "TRANSFER";
  return "OTHER";
}

/** Import signed/final SD documents into the closing room file. */
export async function importFinalDocs(closingId: string, dealId: string, transactionId: string, actorUserId: string | null) {
  const docs = await prisma.lecipmSdDocument.findMany({
    where: {
      transactionId,
      status: { in: [...FINAL_STATUSES] },
    },
  });

  const created: string[] = [];
  for (const d of docs) {
    const ct = mapSdDocumentTypeToClosing(d.documentType);
    const row = await prisma.lecipmPipelineDealClosingDocument.create({
      data: {
        closingId,
        transactionDocumentId: d.id,
        title: d.title,
        docType: ct === "OTHER" ? "OTHER" : ct,
        status: "READY",
        fileUrl: d.fileUrl ?? undefined,
      },
    });
    created.push(row.id);
  }

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "CLOSING_DOCS_IMPORTED",
    actorUserId,
    summary: `Imported ${created.length} signed/final documents`,
    metadataJson: { ids: created },
  });
  await logClosingTimeline(transactionId, "CLOSING_DOCS_IMPORTED", `${created.length} documents linked`);
  logInfo(TAG, { closingId, imported: created.length });
  return created;
}

export async function uploadClosingDocument(input: {
  closingId: string;
  dealId: string;
  transactionId: string | null;
  title: string;
  docType: ClosingDocType | string;
  fileUrl: string | null;
  actorUserId: string | null;
}) {
  const row = await prisma.lecipmPipelineDealClosingDocument.create({
    data: {
      closingId: input.closingId,
      title: input.title.slice(0, 512),
      docType: input.docType.slice(0, 32),
      status: "PENDING",
      fileUrl: input.fileUrl?.slice(0, 8000) ?? undefined,
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId: input.dealId,
    eventType: "CLOSING_DOCUMENT_UPLOADED",
    actorUserId: input.actorUserId,
    summary: `Uploaded closing doc: ${row.title}`,
    metadataJson: { documentId: row.id },
  });
  await logClosingTimeline(input.transactionId, "CLOSING_DOCUMENT_UPLOADED", row.title);
  logInfo(TAG, { id: row.id });
  return row;
}

export async function verifyDocument(documentId: string, dealId: string, transactionId: string | null, actorUserId: string | null) {
  const doc = await prisma.lecipmPipelineDealClosingDocument.findUnique({
    where: { id: documentId },
    include: { closing: true, transactionDocument: true },
  });
  if (!doc || doc.closing.dealId !== dealId) throw new Error("Document not found");

  if (doc.transactionDocumentId) {
    const sd = doc.transactionDocument;
    if (sd && !FINAL_STATUSES.has(sd.status)) {
      throw new Error("Transaction document must be FINAL or SIGNED before verify");
    }
  }

  const row = await prisma.lecipmPipelineDealClosingDocument.update({
    where: { id: documentId },
    data: { status: "VERIFIED" },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "DOCUMENT_VERIFIED",
    actorUserId,
    summary: `Verified: ${row.title}`,
    metadataJson: { documentId },
  });
  await logClosingTimeline(transactionId, "DOCUMENT_VERIFIED", row.title);
  logInfo(TAG, { documentId, verified: true });
  return row;
}

export async function listClosingDocuments(closingId: string) {
  return prisma.lecipmPipelineDealClosingDocument.findMany({
    where: { closingId },
    orderBy: { createdAt: "asc" },
  });
}
