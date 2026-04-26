import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { findDealForClosingAccess } from "@/modules/closing/closing-access";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { updateChecklistItemStatus } from "@/modules/closing/closing-checklist.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string; itemId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId, itemId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const deal = await findDealForClosingAccess(dealId, userId, user?.role);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canMutateExecution(userId, user?.role, deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  try {
    await updateChecklistItemStatus({
      dealId,
      itemId,
      actorUserId: userId,
      status,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      ownerUserId: typeof body.ownerUserId === "string" ? body.ownerUserId : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
