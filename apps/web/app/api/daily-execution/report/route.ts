import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getTodayReportPayload } from "@/src/modules/daily-execution/application/dailyTaskService";

export const dynamic = "force-dynamic";

/** GET end-of-day style summary from stored tasks. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { report, reminders } = await getTodayReportPayload(prisma, userId);
  return NextResponse.json({ report, reminders });
}
