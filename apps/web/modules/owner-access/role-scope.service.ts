import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ExecutiveScope } from "./owner-access.types";

const EXEC_ROLES: Array<
  "office_owner" | "office_admin" | "managing_broker"
> = ["office_owner", "office_admin", "managing_broker"];

export async function resolveExecutiveScope(userId: string, role: PlatformRole): Promise<ExecutiveScope | null> {
  if (role === "ADMIN") {
    return { kind: "platform" };
  }

  const owned = await prisma.brokerageOffice.findMany({
    where: { ownerUserId: userId, officeType: "residential_only" },
    select: { id: true },
  });
  const memberships = await prisma.officeMembership.findMany({
    where: {
      userId,
      membershipStatus: "active",
      role: { in: EXEC_ROLES },
    },
    select: { officeId: true, office: { select: { officeType: true } } },
  });
  const officeIds = [
    ...owned.map((o) => o.id),
    ...memberships.filter((m) => m.office.officeType === "residential_only").map((m) => m.officeId),
  ];
  const uniqueOfficeIds = [...new Set(officeIds)];
  if (uniqueOfficeIds.length === 0) return null;

  const brokers = await prisma.officeMembership.findMany({
    where: {
      officeId: { in: uniqueOfficeIds },
      membershipStatus: "active",
      role: { in: ["residential_broker", "managing_broker", "office_owner", "office_admin", "broker"] },
    },
    select: { userId: true },
  });
  const brokerUserIds = [...new Set(brokers.map((b) => b.userId))];

  return { kind: "office", officeIds: uniqueOfficeIds, brokerUserIds };
}
