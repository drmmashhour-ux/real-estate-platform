import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function assertDealRoomAccess(
  dealRoomId: string,
  userId: string,
  role: PlatformRole
): Promise<{ ok: true } | { ok: false; status: 404 | 403 }> {
  if (role === "ADMIN") {
    const exists = await prisma.dealRoom.findUnique({
      where: { id: dealRoomId },
      select: { id: true },
    });
    return exists ? { ok: true } : { ok: false, status: 404 };
  }
  const row = await prisma.dealRoom.findFirst({
    where: { id: dealRoomId, brokerUserId: userId },
    select: { id: true },
  });
  if (!row) {
    return { ok: false, status: 404 };
  }
  return { ok: true };
}
