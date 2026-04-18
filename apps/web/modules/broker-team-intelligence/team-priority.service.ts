import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertTeamAccess } from "@/modules/broker-collaboration/visibility.service";
import { detectBottlenecksForBroker } from "@/modules/broker-workload/bottleneck-detector.service";
import type { WorkloadInsight } from "@/modules/broker-workload/workload.types";

export async function getTeamPriorityAlerts(teamId: string, actorId: string, role: PlatformRole): Promise<WorkloadInsight[] | null> {
  const ok = await assertTeamAccess(actorId, teamId, role);
  if (!ok) return null;

  const team = await prisma.brokerTeam.findUnique({
    where: { id: teamId },
    include: { members: { where: { status: "active" } } },
  });
  if (!team) return null;

  const primary = await detectBottlenecksForBroker(team.ownerBrokerId);
  const secondary: WorkloadInsight[] = [];
  for (const m of team.members.slice(0, 5)) {
    secondary.push(...(await detectBottlenecksForBroker(m.userId)));
  }

  const merged = [...primary, ...secondary];
  merged.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : 1));
  return merged.slice(0, 12);
}
