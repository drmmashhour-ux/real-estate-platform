import type { BrokerCollaborationVisibilityScope } from "@prisma/client";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function assertDealAccessForBroker(actorId: string, dealId: string, role: PlatformRole): Promise<boolean> {
  if (role === PlatformRole.ADMIN) return true;
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, brokerId: actorId },
    select: { id: true },
  });
  if (deal) return true;
  const assign = await prisma.brokerDealAssignment.findFirst({
    where: { dealId, assignedToUserId: actorId, status: "active" },
    select: { id: true },
  });
  return !!assign;
}

export async function assertTeamAccess(actorId: string, teamId: string, role: PlatformRole): Promise<boolean> {
  if (role === PlatformRole.ADMIN) return true;
  const team = await prisma.brokerTeam.findFirst({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) return false;
  if (team.ownerBrokerId === actorId) return true;
  return team.members.some((m) => m.userId === actorId && m.status === "active");
}

/** Whether actor may read a thread at rest (not including message bodies — use with deal/team checks). */
export function visibilityAllows(
  scope: BrokerCollaborationVisibilityScope,
  ctx: {
    actorId: string;
    threadCreatorId: string;
    isPlatformAdmin: boolean;
    isTeamMember: boolean;
    isDealParticipant: boolean;
  },
): boolean {
  if (ctx.isPlatformAdmin && scope === "brokerage_admin") return true;
  switch (scope) {
    case "private":
      return ctx.actorId === ctx.threadCreatorId || ctx.isPlatformAdmin;
    case "assigned_team":
      return ctx.isTeamMember || ctx.actorId === ctx.threadCreatorId || ctx.isPlatformAdmin;
    case "brokerage_admin":
      return ctx.isPlatformAdmin;
    case "deal_participants_internal":
      return ctx.isDealParticipant || ctx.actorId === ctx.threadCreatorId || ctx.isPlatformAdmin;
    default:
      return false;
  }
}
