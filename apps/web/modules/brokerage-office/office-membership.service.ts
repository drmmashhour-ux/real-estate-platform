import type { OfficeMembershipRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { brokerageOfficeAuditKeys, logBrokerageOfficeAudit } from "@/lib/brokerage/office-audit";
import type { OfficeMemberPatch } from "./brokerage-office.types";

export async function listOfficeRoster(officeId: string) {
  return prisma.officeMembership.findMany({
    where: { officeId },
    include: {
      user: { select: { id: true, name: true, email: true, userCode: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function inviteOrAddMember(input: {
  officeId: string;
  userId: string;
  role: OfficeMembershipRole;
  actorUserId: string;
}) {
  const row = await prisma.officeMembership.upsert({
    where: { officeId_userId: { officeId: input.officeId, userId: input.userId } },
    create: {
      officeId: input.officeId,
      userId: input.userId,
      role: input.role,
      membershipStatus: "active",
    },
    update: { role: input.role, membershipStatus: "active" },
  });

  await logBrokerageOfficeAudit({
    officeId: input.officeId,
    actorUserId: input.actorUserId,
    actionKey: brokerageOfficeAuditKeys.memberAdded,
    payload: { targetUserId: input.userId, role: input.role },
  });

  return row;
}

export async function updateMembership(
  membershipId: string,
  officeId: string,
  actorUserId: string,
  patch: OfficeMemberPatch,
) {
  const row = await prisma.officeMembership.update({
    where: { id: membershipId, officeId },
    data: {
      ...(patch.role ? { role: patch.role } : {}),
      ...(patch.membershipStatus ? { membershipStatus: patch.membershipStatus } : {}),
      ...(patch.metadata !== undefined ? { metadata: patch.metadata as object } : {}),
    },
  });

  await logBrokerageOfficeAudit({
    officeId,
    actorUserId,
    actionKey: brokerageOfficeAuditKeys.memberUpdated,
    payload: { membershipId, patch },
  });

  return row;
}
