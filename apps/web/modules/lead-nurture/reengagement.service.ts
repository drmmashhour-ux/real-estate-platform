/**
 * Re-engagement detection — uses last activity timestamps on Lead (real data).
 */
import { prisma } from "@/lib/db";

export async function findStaleLeadsForBroker(brokerUserId: string, daysStale = 14) {
  const cutoff = new Date(Date.now() - daysStale * 86400000);
  return prisma.lead.findMany({
    where: {
      introducedByBrokerId: brokerUserId,
      lastFollowUpAt: { lt: cutoff },
      pipelineStatus: { notIn: ["won", "lost"] },
    },
    take: 50,
    orderBy: { updatedAt: "asc" },
    select: { id: true, name: true, email: true, lastFollowUpAt: true, pipelineStatus: true },
  });
}
