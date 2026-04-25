import { PlatformRole } from "@prisma/client";

/** Session may record under this owner (agency vs solo vs platform). */
export function sessionOwnsFinancialOwner(
  ownerType: string,
  ownerId: string,
  session: { userId: string; role: PlatformRole },
  opts?: { agencyId?: string | null }
): boolean {
  if (session.role === PlatformRole.ADMIN) return true;
  if (ownerType === "solo_broker") return ownerId === session.userId;
  if (ownerType === "agency") {
    const aid = opts?.agencyId?.trim();
    return !!aid && aid === ownerId;
  }
  if (ownerType === "platform") return false;
  return false;
}
