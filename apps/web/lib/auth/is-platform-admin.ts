import { prisma } from "@/lib/db";

export async function isPlatformAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u?.role === "ADMIN";
}
