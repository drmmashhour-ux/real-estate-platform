import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { findDealForClosingAccess } from "@/modules/closing/closing-access";
import { canConfirmClosing } from "@/modules/closing/closing-access";
import { confirmClosingExecution } from "@/modules/closing/closing-room.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const deal = await findDealForClosingAccess(dealId, userId, user?.role);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canConfirmClosing(userId, user?.role, deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const closingDateRaw =
    typeof body.closingDate === "string" ? body.closingDate : new Date().toISOString().slice(0, 10);
  const closingDate = new Date(closingDateRaw);
  if (Number.isNaN(closingDate.getTime())) {
    return NextResponse.json({ error: "Invalid closingDate" }, { status: 400 });
  }

  const actionPipelineId =
    typeof body.action_pipeline_id === "string" && body.action_pipeline_id.trim()
      ? body.action_pipeline_id.trim()
      : null;

  try {
    const r = await confirmClosingExecution({
      dealId,
      actorUserId: userId,
      closingDate,
      notes: typeof body.notes === "string" ? body.notes : null,
      actionPipelineId,
    });
    return NextResponse.json({ ok: true, assetId: r.assetId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
