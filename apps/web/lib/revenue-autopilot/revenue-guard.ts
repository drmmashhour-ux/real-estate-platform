import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { REVENUE_PLATFORM_SCOPE_ID } from "./constants";

export async function requireRevenueScope(opts: {
  scopeType: "owner" | "platform";
  scopeId?: string | null;
}) {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, status: 401 as const, error: "Sign in required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (opts.scopeType === "platform") {
    if (user?.role !== "ADMIN") {
      return { ok: false as const, status: 403 as const, error: "Admin only" };
    }
    return {
      ok: true as const,
      userId,
      scopeType: "platform" as const,
      scopeId: REVENUE_PLATFORM_SCOPE_ID,
      isAdmin: true,
    };
  }

  const requested = opts.scopeId?.trim() || null;
  if (user?.role === "ADMIN") {
    const effective = requested ?? userId;
    return {
      ok: true as const,
      userId,
      scopeType: "owner" as const,
      scopeId: effective,
      isAdmin: true,
    };
  }

  if (requested && requested !== userId) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }

  return {
    ok: true as const,
    userId,
    scopeType: "owner" as const,
    scopeId: userId,
    isAdmin: false,
  };
}
