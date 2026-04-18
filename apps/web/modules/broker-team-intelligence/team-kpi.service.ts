import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertTeamAccess } from "@/modules/broker-collaboration/visibility.service";
import { aggregateBrokerKpis, resolveKpiDateRange } from "@/modules/broker-kpis/broker-kpi-aggregation.service";

export async function getTeamKpiSummary(teamId: string, actorId: string, role: PlatformRole) {
  const ok = await assertTeamAccess(actorId, teamId, role);
  if (!ok) return null;

  const team = await prisma.brokerTeam.findUnique({
    where: { id: teamId },
    include: { members: { where: { status: "active" } } },
  });
  if (!team) return null;

  const userIds = new Set<string>([team.ownerBrokerId, ...team.members.map((m) => m.userId)]);

  const deals = await prisma.deal.findMany({
    where: { brokerId: { in: [...userIds] } },
    select: { id: true, brokerId: true, status: true, updatedAt: true },
    take: 500,
  });

  const active = deals.filter((d) => d.status !== "closed" && d.status !== "cancelled").length;
  const closed30 = deals.filter(
    (d) => d.status === "closed" && d.updatedAt > new Date(Date.now() - 30 * 86400000),
  ).length;

  const range = resolveKpiDateRange("30d");
  const ownerKpis = await aggregateBrokerKpis(team.ownerBrokerId, range);

  return {
    teamId: team.id,
    teamName: team.name,
    memberCount: userIds.size,
    aggregateActiveDeals: active,
    closedLast30d: closed30,
    ownerSnapshot: ownerKpis,
    disclaimer:
      "Team figures aggregate internal platform activity for operational awareness. They are not rankings of individual merit.",
  };
}
