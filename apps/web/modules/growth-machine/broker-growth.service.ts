/**
 * Broker growth snapshot — uses CRM lead counts (real rows only).
 */
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getBrokerGrowthSnapshot(brokerUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: brokerUserId },
    select: { role: true },
  });
  if (!user || user.role !== PlatformRole.BROKER) {
    return { kind: "not_broker" as const };
  }

  const [openLeads, recentLeads] = await Promise.all([
    prisma.lead.count({
      where: { introducedByBrokerId: brokerUserId, pipelineStatus: { notIn: ["won", "lost"] } },
    }),
    prisma.lead.findMany({
      where: { introducedByBrokerId: brokerUserId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, pipelineStatus: true, createdAt: true, score: true },
    }),
  ]);

  return {
    kind: "broker" as const,
    openPipelineLeads: openLeads,
    recentLeads,
  };
}
