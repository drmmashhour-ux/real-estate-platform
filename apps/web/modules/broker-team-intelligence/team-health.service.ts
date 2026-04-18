import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertTeamAccess } from "@/modules/broker-collaboration/visibility.service";
import { getBrokerWorkloadSummary } from "@/modules/broker-workload/workload.service";

export async function getTeamHealth(teamId: string, actorId: string, role: PlatformRole) {
  const ok = await assertTeamAccess(actorId, teamId, role);
  if (!ok) return null;

  const team = await prisma.brokerTeam.findUnique({
    where: { id: teamId },
    include: { members: { where: { status: "active" } } },
  });
  if (!team) return null;

  const ownerLoad = await getBrokerWorkloadSummary(team.ownerBrokerId, PlatformRole.BROKER);

  const memberLoads = await Promise.all(
    team.members.slice(0, 12).map(async (m) => ({
      userId: m.userId,
      role: m.role,
      workload: await getBrokerWorkloadSummary(m.userId, PlatformRole.BROKER),
    })),
  );

  return {
    teamId: team.id,
    ownerWorkload: ownerLoad,
    members: memberLoads,
  };
}
