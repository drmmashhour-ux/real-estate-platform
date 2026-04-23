import { PlatformRole } from "@prisma/client";
import { sessionOwnsFinancialOwner } from "@/lib/compliance/financial-route-guard";

export function complaintCaseVisibleToSession(
  c: { ownerType: string; ownerId: string; linkedBrokerId: string | null; linkedAgencyId: string | null },
  session: { userId: string; role: PlatformRole },
  opts?: { agencyId?: string | null }
): boolean {
  if (session.role === PlatformRole.ADMIN) return true;
  if (c.linkedBrokerId === session.userId) return true;
  if (c.ownerType === "solo_broker" && c.ownerId === session.userId) return true;
  if (sessionOwnsFinancialOwner(c.ownerType, c.ownerId, session, { agencyId: opts?.agencyId ?? c.linkedAgencyId })) {
    return true;
  }
  return false;
}
