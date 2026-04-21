import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";
import {
  findDealForClosingAccess,
  canUploadClosingDocument,
  canVerifyClosingDocument,
} from "@/modules/closing/closing-access";
import {
  registerClosingDocumentUpload,
  verifyClosingDocument,
  rejectClosingDocument,
} from "@/modules/closing/closing-document.service";

export const dynamic = "force-dynamic";

const TAG = "[closing-document]";

export async function GET(_request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const deal = await findDealForClosingAccess(dealId, userId, user?.role);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const documents = await prisma.dealClosingDocument.findMany({
    where: { dealId },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const deal = await findDealForClosingAccess(dealId, userId, user?.role);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "upload";

  if (action === "verify") {
    if (!canVerifyClosingDocument(userId, user?.role, deal)) {
      logInfo(`${TAG}`, { denied: true, dealId });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const documentId = typeof body.documentId === "string" ? body.documentId : "";
    if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });
    try {
      await verifyClosingDocument({ dealId, documentId, actorUserId: userId });
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
    }
  }

  if (action === "reject") {
    if (!canVerifyClosingDocument(userId, user?.role, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const documentId = typeof body.documentId === "string" ? body.documentId : "";
    if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });
    try {
      await rejectClosingDocument({
        dealId,
        documentId,
        actorUserId: userId,
        notes: typeof body.notes === "string" ? body.notes : null,
      });
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
    }
  }

  if (!canUploadClosingDocument(userId, user?.role, deal)) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";
  if (!fileUrl) return NextResponse.json({ error: "fileUrl required" }, { status: 400 });

  try {
    const row = await registerClosingDocumentUpload({
      dealId,
      actorUserId: userId,
      fileUrl,
      documentId: typeof body.documentId === "string" ? body.documentId : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
      required: typeof body.required === "boolean" ? body.required : undefined,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
