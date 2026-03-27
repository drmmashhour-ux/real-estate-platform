import { prisma } from "@/lib/db";
import type { PlatformRole } from "@prisma/client";

export type AdminViewer = { userId: string; role: PlatformRole };

export async function requireAdminUser(userId: string | null): Promise<AdminViewer | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "ADMIN") return null;
  return { userId: user.id, role: user.role };
}
