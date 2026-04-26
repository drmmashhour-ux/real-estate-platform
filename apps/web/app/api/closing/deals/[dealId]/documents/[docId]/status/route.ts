import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { findDealForClosingAccess, canVerifyClosingDocument } from "@/modules/closing/closing-access";
import { verifyClosingDocument, rejectClosingDocument } from "@/modules/closing/closing-document.service";

export const dynamic = "force-dynamic";

const TAG = "[closing-document]";

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string; docId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId, docId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const deal = await findDealForClosingAccess(dealId, userId, user?.role);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canVerifyClosingDocument(userId, user?.role, deal)) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status.toUpperCase() : "";

  try {
    if (status === "VERIFIED") {
      await verifyClosingDocument({ dealId, documentId: docId, actorUserId: userId });
      return NextResponse.json({ ok: true });
    }
    if (status === "REJECTED") {
      await rejectClosingDocument({
        dealId,
        documentId: docId,
        actorUserId: userId,
        notes: typeof body.notes === "string" ? body.notes : null,
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "status must be VERIFIED or REJECTED" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
