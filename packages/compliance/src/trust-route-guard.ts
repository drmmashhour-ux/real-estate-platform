import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireBrokerOrAdminTrustSession(): Promise<
  | { ok: true; userId: string; role: PlatformRole }
  | { ok: false; response: NextResponse }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId, role: user.role };
}

/** Broker may only access deposits they broker; admin may access any. */
export function depositVisibleToSession(deposit: { brokerId: string | null; agencyId: string | null }, userId: string, role: PlatformRole): boolean {
  if (role === PlatformRole.ADMIN) return true;
  return deposit.brokerId === userId;
}

/** Whether the session may create deposits against this trust profile. */
export function sessionOwnsTrustProfile(
  profile: { ownerType: string; ownerId: string },
  session: { userId: string; role: PlatformRole },
  opts?: { agencyId?: string | null }
): boolean {
  if (session.role === PlatformRole.ADMIN) return true;
  if (profile.ownerType === "solo_broker") return profile.ownerId === session.userId;
  if (profile.ownerType === "agency") {
    const aid = opts?.agencyId?.trim();
    return !!aid && aid === profile.ownerId;
  }
  return false;
}
