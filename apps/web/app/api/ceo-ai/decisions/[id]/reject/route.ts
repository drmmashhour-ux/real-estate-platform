import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { PlatformRole } from "@prisma/client";
import { rejectCeoDecision } from "@/modules/ceo-ai/ceo-ai.service";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (me?.role !== PlatformRole.BROKER && me?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    await rejectCeoDecision(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
