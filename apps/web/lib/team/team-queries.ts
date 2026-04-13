import type { PlatformRole } from "@prisma/client";
import { TeamTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { OPS_TEAM_ROLES } from "@/lib/admin/staff-portal-auth";

/** UTC calendar key `YYYY-MM-DD`. */
export function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function getTodayTarget(userId: string, day = utcDateKey()) {
  return prisma.teamDailyTarget.findUnique({
    where: { userId_targetDay: { userId, targetDay: day } },
  });
}

export type TeamMemberPerformance = {
  userId: string;
  name: string | null;
  email: string;
  role: PlatformRole;
  tasksAssigned: number;
  tasksDone: number;
  tasksInProgress: number;
  avgImpact: number | null;
  avgCompletionHours: number | null;
  reportsSubmitted: number;
};

export async function getPerformanceForUsers(userIds: string[], since: Date): Promise<TeamMemberPerformance[]> {
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, role: true },
  });

  const tasks = await prisma.teamTask.groupBy({
    by: ["assigneeUserId", "status"],
    where: { assigneeUserId: { in: userIds }, createdAt: { gte: since } },
    _count: { id: true },
  });

  const doneTasks = await prisma.teamTask.findMany({
    where: {
      assigneeUserId: { in: userIds },
      status: TeamTaskStatus.DONE,
      completedAt: { gte: since },
    },
    select: {
      assigneeUserId: true,
      impactScore: true,
      createdAt: true,
      completedAt: true,
    },
  });

  const reports = await prisma.teamDailyReport.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds }, createdAt: { gte: since } },
    _count: { id: true },
  });

  const taskMap = new Map<string, { assigned: number; done: number; inProgress: number }>();
  for (const uid of userIds) {
    taskMap.set(uid, { assigned: 0, done: 0, inProgress: 0 });
  }
  for (const row of tasks) {
    const cur = taskMap.get(row.assigneeUserId) ?? { assigned: 0, done: 0, inProgress: 0 };
    const c = row._count.id;
    cur.assigned += c;
    if (row.status === TeamTaskStatus.DONE) cur.done += c;
    if (row.status === TeamTaskStatus.IN_PROGRESS) cur.inProgress += c;
    taskMap.set(row.assigneeUserId, cur);
  }

  const impactByUser = new Map<string, number[]>();
  const hoursByUser = new Map<string, number[]>();
  for (const t of doneTasks) {
    if (t.impactScore != null) {
      const arr = impactByUser.get(t.assigneeUserId) ?? [];
      arr.push(t.impactScore);
      impactByUser.set(t.assigneeUserId, arr);
    }
    if (t.completedAt) {
      const hrs = (t.completedAt.getTime() - t.createdAt.getTime()) / 3600000;
      const arr = hoursByUser.get(t.assigneeUserId) ?? [];
      arr.push(hrs);
      hoursByUser.set(t.assigneeUserId, arr);
    }
  }

  const reportMap = new Map(reports.map((r) => [r.userId, r._count.id]));

  return users.map((u) => {
    const tm = taskMap.get(u.id) ?? { assigned: 0, done: 0, inProgress: 0 };
    const impacts = impactByUser.get(u.id) ?? [];
    const hrs = hoursByUser.get(u.id) ?? [];
    const avgImpact = impacts.length ? impacts.reduce((a, b) => a + b, 0) / impacts.length : null;
    const avgCompletionHours = hrs.length ? hrs.reduce((a, b) => a + b, 0) / hrs.length : null;
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      tasksAssigned: tm.assigned,
      tasksDone: tm.done,
      tasksInProgress: tm.inProgress,
      avgImpact,
      avgCompletionHours,
      reportsSubmitted: reportMap.get(u.id) ?? 0,
    };
  });
}

/** Operator accounts for admin performance rollup (excludes full ADMIN). */
export async function listOpsUserIds(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: [...OPS_TEAM_ROLES] } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
