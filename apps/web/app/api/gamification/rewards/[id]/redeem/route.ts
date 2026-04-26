import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { PlatformRole } from "@prisma/client";
import { redeemReward } from "@/modules/gamification/broker-rewards.service";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!me || me.role !== PlatformRole.BROKER) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const ok = await redeemReward(id, userId);
  return NextResponse.json({ ok });
}
