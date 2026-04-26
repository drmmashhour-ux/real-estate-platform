import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { findDealForClosingAccess } from "@/modules/closing/closing-access";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { addSignatureRow, updateSignatureStatus } from "@/modules/closing/closing-signature.service";

export const dynamic = "force-dynamic";

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

  if (typeof body.signatureId === "string") {
    if (!canMutateExecution(userId, user?.role, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const status = typeof body.status === "string" ? body.status.toUpperCase() : "";
    if (!["PENDING", "SIGNED", "DECLINED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    try {
      await updateSignatureStatus({
        dealId,
        signatureId: body.signatureId,
        actorUserId: userId,
        status: status as "PENDING" | "SIGNED" | "DECLINED",
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
    }
  }

  if (!canMutateExecution(userId, user?.role, deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const signerName = typeof body.signerName === "string" ? body.signerName.trim() : "";
  const signerRole = typeof body.signerRole === "string" ? body.signerRole.trim() : "";
  if (!signerName || !signerRole) return NextResponse.json({ error: "signerName and signerRole required" }, { status: 400 });

  try {
    const row = await addSignatureRow({
      dealId,
      actorUserId: userId,
      signerName,
      signerRole,
      documentId: typeof body.documentId === "string" ? body.documentId : null,
      required: typeof body.required === "boolean" ? body.required : true,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
