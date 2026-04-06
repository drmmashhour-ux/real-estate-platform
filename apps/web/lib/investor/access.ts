import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Internal LECIPM metrics dashboard — not public marketing. */
export const INVESTOR_DASHBOARD_ROLES: readonly PlatformRole[] = ["ADMIN", "ACCOUNTANT", "INVESTOR"];

export async function canAccessInvestorDashboard(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u != null && INVESTOR_DASHBOARD_ROLES.includes(u.role);
}
