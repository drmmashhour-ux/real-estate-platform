import { prisma } from "@/lib/db";

/**
 * Counts how often broker assistant actions were executed (from lead timeline).
 */
export async function getBrokerAssistantExecutionStats(since: Date): Promise<{ count: number }> {
  const count = await prisma.leadTimelineEvent.count({
    where: { eventType: "BROKER_ASSISTANT_EXEC", createdAt: { gte: since } },
  });
  return { count };
}
