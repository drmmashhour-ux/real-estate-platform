import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import {
  attachUploadedFile,
  createDocument,
  generateDocument,
  getDocuments,
  isAllowedDocumentType,
  updateDocumentStatus,
  versionDocument,
} from "@/modules/transactions/transaction-document.service";

export const dynamic = "force-dynamic";

async function guardTx(id: string, auth: { userId: string; role: string }) {
  const tx = await getTransactionById(id);
  if (!tx) return { ok: false as const, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (!canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, tx };
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const g = await guardTx(id, auth);
  if (!g.ok) return g.response;

  try {
    const docs = await getDocuments(id);
    return NextResponse.json({
      transactionNumber: g.tx.transactionNumber,
      documents: docs.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        title: d.title,
        status: d.status,
        versionNumber: d.versionNumber,
        transactionNumber: d.transactionNumber,
        fileUrl: d.fileUrl,
        fileFormat: d.fileFormat,
        templateCode: d.templateCode,
        requiredForClosing: d.requiredForClosing,
        updatedAt: d.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    logError("[sd.documents.list]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const g = await guardTx(id, auth);
  if (!g.ok) return g.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "draft";

  try {
    if (action === "draft") {
      const documentType = typeof body.documentType === "string" ? body.documentType : "";
      const title = typeof body.title === "string" ? body.title : "";
      if (!documentType || !title) return NextResponse.json({ error: "documentType and title required" }, { status: 400 });
      if (!isAllowedDocumentType(documentType)) return NextResponse.json({ error: "Invalid documentType" }, { status: 400 });
      const requiredForClosing = body.requiredForClosing === true;
      const doc = await createDocument({
        transactionId: id,
        documentType,
        title,
        transactionNumber: g.tx.transactionNumber,
        requiredForClosing,
      });
      return NextResponse.json({ transactionNumber: g.tx.transactionNumber, document: doc });
    }

    if (action === "generate") {
      const templateCode = typeof body.templateCode === "string" ? body.templateCode : "";
      if (!templateCode) return NextResponse.json({ error: "templateCode required" }, { status: 400 });
      const extra = typeof body.extraBody === "string" ? body.extraBody : undefined;
      const doc = await generateDocument(id, templateCode, extra, { actorRole: auth.role });
      return NextResponse.json({ transactionNumber: g.tx.transactionNumber, document: doc });
    }

    if (action === "upload") {
      const title = typeof body.title === "string" ? body.title : "";
      const documentType = typeof body.documentType === "string" ? body.documentType : "UPLOAD";
      const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl : "";
      if (!title || !fileUrl) return NextResponse.json({ error: "title and fileUrl required" }, { status: 400 });
      const doc = await attachUploadedFile({
        transactionId: id,
        transactionNumber: g.tx.transactionNumber,
        title,
        documentType,
        fileUrl,
        fileFormat: typeof body.fileFormat === "string" ? body.fileFormat : null,
      });
      return NextResponse.json({ transactionNumber: g.tx.transactionNumber, document: doc });
    }

    if (action === "version") {
      const documentId = typeof body.documentId === "string" ? body.documentId : "";
      if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });
      const doc = await versionDocument(documentId);
      return NextResponse.json({ transactionNumber: g.tx.transactionNumber, document: doc });
    }

    if (action === "status") {
      const documentId = typeof body.documentId === "string" ? body.documentId : "";
      const status = typeof body.status === "string" ? body.status : "";
      if (!documentId || !status) return NextResponse.json({ error: "documentId and status required" }, { status: 400 });
      const doc = await updateDocumentStatus(documentId, status);
      if (doc.transactionId !== id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.json({ transactionNumber: g.tx.transactionNumber, document: doc });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    logError("[sd.documents.post]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
