import type { OfficeMembershipRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const FINANCE_ROLES = new Set<OfficeMembershipRole>([
  "office_owner",
  "office_admin",
  "finance_admin",
  "managing_broker",
]);

const ROSTER_MANAGE_ROLES = new Set<OfficeMembershipRole>([
  "office_owner",
  "office_admin",
  "managing_broker",
]);

export type OfficeAccessContext = {
  membership: {
    id: string;
    officeId: string;
    userId: string;
    role: OfficeMembershipRole;
    membershipStatus: string;
  };
  canViewOfficeFinance: boolean;
  canManageRoster: boolean;
  canApproveCommissions: boolean;
};

export function roleCanViewOfficeFinance(role: OfficeMembershipRole): boolean {
  return FINANCE_ROLES.has(role);
}

export function roleCanManageRoster(role: OfficeMembershipRole): boolean {
  return ROSTER_MANAGE_ROLES.has(role);
}

export function roleCanApproveCommissions(role: OfficeMembershipRole): boolean {
  return FINANCE_ROLES.has(role);
}

export async function getOfficeAccess(
  userId: string,
  officeId: string,
): Promise<OfficeAccessContext | null> {
  const membership = await prisma.officeMembership.findFirst({
    where: {
      officeId,
      userId,
      membershipStatus: "active",
    },
  });
  if (!membership) return null;
  return {
    membership: {
      id: membership.id,
      officeId: membership.officeId,
      userId: membership.userId,
      role: membership.role,
      membershipStatus: membership.membershipStatus,
    },
    canViewOfficeFinance: roleCanViewOfficeFinance(membership.role),
    canManageRoster: roleCanManageRoster(membership.role),
    canApproveCommissions: roleCanApproveCommissions(membership.role),
  };
}

/** First active office membership for broker (v1 single-office default). */
export async function getDefaultOfficeIdForUser(userId: string): Promise<string | null> {
  const m = await prisma.officeMembership.findFirst({
    where: { userId, membershipStatus: "active" },
    orderBy: { updatedAt: "desc" },
    select: { officeId: true },
  });
  return m?.officeId ?? null;
}
