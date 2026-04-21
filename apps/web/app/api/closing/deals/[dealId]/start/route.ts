import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { findDealForClosingAccess } from "@/modules/closing/closing-access";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { startClosingRoom } from "@/modules/closing/closing-room.service";

export const dynamic = "force-dynamic";

const TAG = "[closing-room]";

export async function POST(_request: Request, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const deal = await findDealForClosingAccess(dealId, userId, user?.role);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canMutateExecution(userId, user?.role, deal)) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const r = await startClosingRoom({ dealId, actorUserId: userId });
    return NextResponse.json({ ok: true, closingId: r.closingId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to start closing room";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
