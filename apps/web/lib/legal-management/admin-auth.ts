import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const ROLES: PlatformRole[] = ["ADMIN", "ACCOUNTANT"];

export async function canAccessLegalManagement(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, accountStatus: true },
  });
  return Boolean(u?.accountStatus === "ACTIVE" && u.role && ROLES.includes(u.role));
}
