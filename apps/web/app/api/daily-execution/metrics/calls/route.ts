import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { incrementCallsBooked } from "@/src/modules/daily-execution/application/dailyMetricsService";

export const dynamic = "force-dynamic";

/** POST { delta? } — bump metrics-only calls booked (prefer logging via tasks when possible). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { delta?: number };
  const delta = typeof body.delta === "number" && body.delta > 0 ? Math.min(50, Math.floor(body.delta)) : 1;

  await incrementCallsBooked(prisma, userId, delta);
  return NextResponse.json({ ok: true });
}
