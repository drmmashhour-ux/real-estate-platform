import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requirePortfolioOwnerOrAdmin(opts?: { targetOwnerUserId?: string | null }) {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, status: 401 as const, error: "Sign in required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const target = opts?.targetOwnerUserId?.trim() || null;

  if (user?.role === "ADMIN") {
    const effectiveOwnerId = target ?? userId;
    return { ok: true as const, userId, effectiveOwnerId, isAdmin: true };
  }

  if (target && target !== userId) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }

  return { ok: true as const, userId, effectiveOwnerId: userId, isAdmin: false };
}
