import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { incrementReplies } from "@/src/modules/daily-execution/application/dailyMetricsService";

export const dynamic = "force-dynamic";

/** POST { delta? } — manual reply counter (you received a reply; nothing is sent). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { delta?: number };
  const delta = typeof body.delta === "number" && body.delta > 0 ? Math.min(50, Math.floor(body.delta)) : 1;

  await incrementReplies(prisma, userId, delta);
  return NextResponse.json({ ok: true });
}
