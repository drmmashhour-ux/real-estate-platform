import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const ADMIN_SURFACE_ROLES = new Set<PlatformRole>(["ADMIN", "ACCOUNTANT"]);

export async function isPlatformAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u?.role === "ADMIN";
}

/** Matches `app/admin/layout.tsx` — ADMIN or ACCOUNTANT may use admin surfaces. */
export async function isPlatformAdminSurface(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u != null && ADMIN_SURFACE_ROLES.has(u.role);
}
