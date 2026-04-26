import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildDailyExecutionOverview } from "@/src/modules/daily-execution/application/dailyMetricsService";

export const dynamic = "force-dynamic";

/** GET — tasks, metrics, DM variants, follow-up queue preview, pipeline counts, insights (assist-only). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await buildDailyExecutionOverview(prisma, userId);
  return NextResponse.json(payload);
}
