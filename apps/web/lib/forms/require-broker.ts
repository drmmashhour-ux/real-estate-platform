import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

const ALLOWED: PlatformRole[] = ["BROKER", "ADMIN", "MORTGAGE_BROKER"];

export async function requireBrokerLikeApi(): Promise<
  { ok: true; userId: string; role: PlatformRole } | { ok: false; status: number; error: string }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, status: 401, error: "Sign in required" };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, accountStatus: true },
  });
  if (!user || user.accountStatus !== "ACTIVE") {
    return { ok: false, status: 401, error: "Invalid session" };
  }
  if (!ALLOWED.includes(user.role)) {
    return { ok: false, status: 403, error: "Broker or admin access required" };
  }
  return { ok: true, userId, role: user.role };
}
