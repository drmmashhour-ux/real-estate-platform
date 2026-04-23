import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { PlatformRole } from "@prisma/client";

/**
 * Shared authentication for CEO-level APIs.
 * Only Admins and Brokers (who act as executive users in this platform) are allowed.
 */
export async function verifyCeoAccess() {
  const userId = await getGuestId();
  if (!userId) return { error: "Unauthorized", status: 401 };

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (me?.role !== PlatformRole.ADMIN && me?.role !== PlatformRole.BROKER) {
    return { error: "Forbidden", status: 403 };
  }

  return { userId, ok: true };
}
