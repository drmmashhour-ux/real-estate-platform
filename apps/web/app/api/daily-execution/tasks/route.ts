import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getTodayTasks, buildCoachingReminders } from "@/src/modules/daily-execution/application/dailyTaskService";

export const dynamic = "force-dynamic";

/** GET today’s tasks + coaching reminders (no auto actions). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskDate, tasks } = await getTodayTasks(prisma, userId);
  return NextResponse.json({
    taskDate: taskDate.toISOString().slice(0, 10),
    tasks: tasks.map((t) => ({
      id: t.id,
      taskType: t.taskType,
      targetCount: t.targetCount,
      completedCount: t.completedCount,
      status: t.status,
      metadata: t.metadata,
      repliesNote: t.repliesNote,
    })),
    reminders: buildCoachingReminders(tasks, new Date()),
  });
}
