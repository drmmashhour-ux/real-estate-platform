import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";

const prisma = getLegacyDB();

export type ManagerAiRunMetrics = {
  runs: number;
  actionsExecuted: number;
  actionsFailed: number;
};

export async function getManagerAiRunCounts(since: Date): Promise<ManagerAiRunMetrics> {
  try {
    const [runs, actionsExecuted, actionsFailed] = await Promise.all([
      prisma.managerAiAgentRun.count({ where: { createdAt: { gte: since } } }),
      prisma.managerAiActionLog.count({
        where: { createdAt: { gte: since }, NOT: { status: "failed" } },
      }),
      prisma.managerAiActionLog.count({
        where: { createdAt: { gte: since }, status: "failed" },
      }),
    ]);
    return { runs, actionsExecuted, actionsFailed };
  } catch {
    return { runs: 0, actionsExecuted: 0, actionsFailed: 0 };
  }
}
