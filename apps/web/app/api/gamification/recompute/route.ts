import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { PlatformRole } from "@prisma/client";
import { recomputeBrokerGamification } from "@/modules/gamification/broker-recompute.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { brokerId?: string };
  let targetId = userId;

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!me || (me.role !== PlatformRole.BROKER && me.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (body.brokerId && me.role === PlatformRole.ADMIN) {
    targetId = body.brokerId;
  }

  if (me.role === PlatformRole.BROKER && body.brokerId && body.brokerId !== userId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const result = await recomputeBrokerGamification(targetId);
  return NextResponse.json({ ok: result.ok, ...result });
}
