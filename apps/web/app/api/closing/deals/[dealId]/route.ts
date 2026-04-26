import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { findDealForClosingAccess } from "@/modules/closing/closing-access";
import { getClosingRoomDetail } from "@/modules/closing/closing-room.service";

export const dynamic = "force-dynamic";

const TAG = "[closing-room]";

export async function GET(_request: Request, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const deal = await findDealForClosingAccess(dealId, userId, user?.role);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  logInfo(`${TAG}`, { dealId });
  const detail = await getClosingRoomDetail(dealId);
  return NextResponse.json(detail);
}
