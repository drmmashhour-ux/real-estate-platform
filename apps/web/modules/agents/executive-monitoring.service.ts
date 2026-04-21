import { prisma } from "@/lib/db";
import { executiveLog } from "./executive-log";

export async function getExecutiveMonitoringSummary(userId: string) {
  executiveLog.monitoring("snapshot", { userId });

  const [runs, tasks, conflicts] = await Promise.all([
    prisma.agentRun.findMany({
      where: { triggeredByUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { agentName: true, status: true, createdAt: true },
    }),
    prisma.executiveTask.groupBy({
      by: ["status"],
      where: { ownerUserId: userId },
      _count: { _all: true },
    }),
    prisma.executiveConflict.count({
      where: { resolutionStatus: "OPEN" },
    }),
  ]);

  const runCounts = runs.reduce(
    (acc, r) => {
      acc[r.agentName] = (acc[r.agentName] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const warnings = runs.filter((r) => r.status === "WARNING").length;
  const errors = runs.filter((r) => r.status === "ERROR").length;

  return {
    agentRunCounts: runCounts,
    taskVolumeByStatus: tasks,
    unresolvedConflicts: conflicts,
    recentWarningRuns: warnings,
    recentErrorRuns: errors,
    staleCriticalTasks: await prisma.executiveTask.count({
      where: {
        ownerUserId: userId,
        priority: "CRITICAL",
        status: { in: ["OPEN", "IN_PROGRESS"] },
        updatedAt: { lt: new Date(Date.now() - 7 * 86400000) },
      },
    }),
  };
}
