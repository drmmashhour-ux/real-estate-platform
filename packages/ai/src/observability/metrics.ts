import { prisma } from "@/lib/db";

export async function getManagerAiRunCounts(since: Date) {
  const [runs, actions, failedActions] = await Promise.all([
    prisma.managerAiAgentRun.count({ where: { createdAt: { gte: since } } }),
    prisma.managerAiActionLog.count({ where: { createdAt: { gte: since }, status: "executed" } }),
    prisma.managerAiActionLog.count({ where: { createdAt: { gte: since }, status: "failed" } }),
  ]);
  return { runs, actionsExecuted: actions, actionsFailed: failedActions };
}
