import { PlatformRole } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function resolveBrokerSession(userId: string | null): Promise<
  | { ok: true; brokerId: string }
  | { ok: false; status: number; message: string }
> {
  if (!userId) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === PlatformRole.BROKER || user?.role === PlatformRole.ADMIN) {
      return { ok: true, brokerId: userId };
    }

    return { ok: false, status: 403, message: "Broker workspace required" };
  } catch {
    return { ok: false, status: 500, message: "Unable to verify session" };
  }
}
