import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { incrementTask } from "@/src/modules/daily-execution/application/dailyTaskService";

export const dynamic = "force-dynamic";

/** POST { taskType, delta? } — manual progress only. */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { taskType?: string; delta?: number };
  const taskType = typeof body.taskType === "string" ? body.taskType.trim() : "";
  const delta = typeof body.delta === "number" && body.delta > 0 ? Math.min(50, Math.floor(body.delta)) : 1;

  const result = await incrementTask(prisma, userId, taskType, delta);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    task: {
      id: result.task.id,
      taskType: result.task.taskType,
      completedCount: result.task.completedCount,
      targetCount: result.task.targetCount,
      status: result.task.status,
    },
  });
}
