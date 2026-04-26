import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import {
  importFinalDocs,
  listClosingDocuments,
  uploadClosingDocument,
  verifyDocument,
} from "@/modules/closing/closing-document.service";
import { canManageClosing } from "@/modules/closing/closing-policy";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal) || !canManageClosing(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const closing = await prisma.lecipmPipelineDealClosing.findUnique({ where: { dealId } });
    if (!closing?.transactionId) {
      return NextResponse.json({ error: "Closing not initialized or no transaction" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const mode = typeof body.mode === "string" ? body.mode : "";

    if (mode === "import") {
      await importFinalDocs(closing.id, dealId, closing.transactionId, auth.userId);
      const docs = await listClosingDocuments(closing.id);
      return NextResponse.json({ documents: docs });
    }

    if (mode === "upload") {
      const title = typeof body.title === "string" ? body.title : "";
      const docType = typeof body.docType === "string" ? body.docType : "OTHER";
      const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl : null;
      if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

      const doc = await uploadClosingDocument({
        closingId: closing.id,
        dealId,
        transactionId: closing.transactionId,
        title,
        docType,
        fileUrl,
        actorUserId: auth.userId,
      });
      return NextResponse.json({ document: doc });
    }

    if (mode === "verify") {
      const documentId = typeof body.documentId === "string" ? body.documentId : "";
      if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

      const doc = await verifyDocument(documentId, dealId, closing.transactionId, auth.userId);
      return NextResponse.json({ document: doc });
    }

    return NextResponse.json({ error: "mode must be import | upload | verify" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    logError("[api.deals.closing.document]", { error: e });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
