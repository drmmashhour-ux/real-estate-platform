import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { recommendationOutcomeRates } from "@/modules/personalized-recommendations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const targetUserId = url.searchParams.get("userId")?.trim() || userId;
  const days = Math.min(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 365);
  const rates = await recommendationOutcomeRates(targetUserId, days);
  return NextResponse.json(rates);
}
