import type { PlatformRole } from "@prisma/client";

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { roleCanUseImmoDealRooms } from "@/modules/deal-room/deal-room-access";

export async function requireImmoDealRoomActor(): Promise<
  | {
      ok: true;
      userId: string;
      role: PlatformRole;
      displayName: string;
      email: string | null;
    }
  | { ok: false; status: number; message: string }
> {
  const userId = await getGuestId();
  if (!userId) return { ok: false, status: 401, message: "Sign in required" };

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!u) return { ok: false, status: 401, message: "User not found" };
  if (!roleCanUseImmoDealRooms(u.role)) {
    return { ok: false, status: 403, message: "ImmoContact deal rooms are limited to brokers, admins, and internal operators in V1." };
  }

  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  const displayName = name || (u.email?.split("@")[0] ?? "User");

  return { ok: true, userId, role: u.role, displayName, email: u.email };
}
