import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { recordBrokerUsageEvent, usageAmountForType } from "@/modules/billing/lecipm-launch-usage";
import {
  assertTransactionNumberInPayload,
  buildMandatoryTransactionLine,
  buildSdFormContext,
  renderGeneratedDocumentHtml,
} from "./transaction-form-context.service";
import { appendAuditProof } from "./transaction-audit-proof.service";
import { logTimelineEvent } from "./transaction-timeline.service";

const TAG = "[transaction.document]";

const DOC_TYPES = [
  "CONTRACT",
  "FORM",
  "DISCLOSURE",
  "ADDENDUM",
  "FINANCIAL",
  "NOTARY",
  "UPLOAD",
] as const;

export function isAllowedDocumentType(t: string): boolean {
  return DOC_TYPES.includes(t as (typeof DOC_TYPES)[number]);
}

export async function createDocument(input: {
  transactionId: string;
  documentType: string;
  title: string;
  transactionNumber: string;
  status?: string;
  requiredForClosing?: boolean;
}) {
  const doc = await prisma.lecipmSdDocument.create({
    data: {
      transactionId: input.transactionId,
      documentType: input.documentType.slice(0, 32),
      title: input.title.slice(0, 512),
      transactionNumber: input.transactionNumber,
      status: (input.status ?? "DRAFT").slice(0, 24),
      requiredForClosing: input.requiredForClosing ?? false,
    },
  });

  await logTimelineEvent(prisma, input.transactionId, "DOCUMENT_CREATED", `Document draft: ${doc.title}`);
  logInfo(`${TAG}`, { action: "create", documentId: doc.id });
  return doc;
}

export async function generateDocument(transactionId: string, templateCode: string, extraMarkdownBody?: string) {
  const ctx = await buildSdFormContext(transactionId);
  const body = extraMarkdownBody?.trim() ? `<p>${extraMarkdownBody}</p>` : "<p>Generated document body.</p>";
  const html = renderGeneratedDocumentHtml(ctx, templateCode, body);

  assertTransactionNumberInPayload(html, ctx.transactionNumber);

  const doc = await prisma.lecipmSdDocument.create({
    data: {
      transactionId,
      documentType: "CONTRACT",
      templateCode: templateCode.slice(0, 64),
      title: `Generated: ${templateCode}`.slice(0, 512),
      transactionNumber: ctx.transactionNumber,
      status: "GENERATED",
      fileFormat: "HTML",
      bodyHtml: html,
      metadataJson: {
        templateCode,
        transactionNumber: ctx.transactionNumber,
        mandatoryLine: `Transaction No: ${ctx.transactionNumber}`,
      } as object,
    },
  });

  await logTimelineEvent(prisma, transactionId, "DOCUMENT_GENERATED", `Generated document ${doc.id} (${templateCode})`);
  await appendAuditProof({
    transactionId,
    documentId: doc.id,
    eventType: "DOCUMENT_GENERATED",
    payload: { templateCode, documentId: doc.id },
  });
  logInfo(`${TAG}`, { action: "generate", documentId: doc.id });

  const txRow = await prisma.lecipmSdTransaction.findUnique({
    where: { id: transactionId },
    select: { brokerId: true },
  });
  if (txRow) {
    await recordBrokerUsageEvent({
      userId: txRow.brokerId,
      type: "CONTRACT",
      amount: usageAmountForType("CONTRACT"),
      metaJson: { transactionId, documentId: doc.id, templateCode },
    });
  }

  return doc;
}

const LOCKED_DOC_STATUSES = new Set(["FINAL", "SIGNED"]);

export async function assertDocumentEditable(documentId: string) {
  const doc = await prisma.lecipmSdDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");
  if (LOCKED_DOC_STATUSES.has(doc.status) || doc.lockedAt) {
    throw new Error("Document is locked or finalized");
  }
}

export async function attachUploadedFile(input: {
  transactionId: string;
  transactionNumber: string;
  title: string;
  documentType: string;
  fileUrl: string;
  fileFormat?: string | null;
}) {
  const htmlNote = `<p>${buildMandatoryTransactionLine(input.transactionNumber)}</p><p>External upload linked.</p>`;
  assertTransactionNumberInPayload(htmlNote, input.transactionNumber);

  const doc = await prisma.lecipmSdDocument.create({
    data: {
      transactionId: input.transactionId,
      documentType: input.documentType.slice(0, 32),
      title: input.title.slice(0, 512),
      fileUrl: input.fileUrl,
      fileFormat: input.fileFormat?.slice(0, 16) ?? "UPLOAD",
      transactionNumber: input.transactionNumber,
      status: "GENERATED",
      bodyHtml: htmlNote,
      metadataJson: {
        upload: true,
        transactionNumber: input.transactionNumber,
        mandatoryLine: `Transaction No: ${input.transactionNumber}`,
      } as object,
    },
  });

  await logTimelineEvent(prisma, input.transactionId, "DOCUMENT_UPLOADED", `Uploaded: ${doc.title}`);
  logInfo(`${TAG}`, { action: "upload", documentId: doc.id });
  return doc;
}

export async function versionDocument(documentId: string) {
  const prev = await prisma.lecipmSdDocument.findUnique({ where: { id: documentId } });
  if (!prev) throw new Error("Document not found");

  const next = await prisma.lecipmSdDocument.create({
    data: {
      transactionId: prev.transactionId,
      documentType: prev.documentType,
      templateCode: prev.templateCode,
      title: `${prev.title} (v${prev.versionNumber + 1})`.slice(0, 512),
      fileUrl: prev.fileUrl,
      fileFormat: prev.fileFormat,
      versionNumber: prev.versionNumber + 1,
      status: "DRAFT",
      transactionNumber: prev.transactionNumber,
      bodyHtml: prev.bodyHtml,
      metadataJson: prev.metadataJson ?? undefined,
      replacesDocumentId: prev.id,
    },
  });

  await logTimelineEvent(prisma, prev.transactionId, "DOCUMENT_CREATED", `New version ${next.versionNumber} supersedes ${prev.id}`);
  logInfo(`${TAG}`, { action: "version", documentId: next.id });
  return next;
}

export async function updateDocumentStatus(documentId: string, status: string) {
  await assertDocumentEditable(documentId);

  const row = await prisma.lecipmSdDocument.update({
    where: { id: documentId },
    data: { status: status.slice(0, 24) },
  });

  if (status === "SIGNED") {
    await logTimelineEvent(prisma, row.transactionId, "DOCUMENT_SIGNED", `Document ${documentId} marked SIGNED`);
  }

  logInfo(`${TAG}`, { action: "status", documentId, status });
  return row;
}

export async function getDocuments(transactionId: string) {
  return prisma.lecipmSdDocument.findMany({
    where: { transactionId },
    orderBy: [{ updatedAt: "desc" }],
  });
}
