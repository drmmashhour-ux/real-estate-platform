import { prisma } from "@/lib/db";

/** Host may run portfolio (own host id) or listing they own; admins pass via caller. */
export async function canInvokeAutonomyCycle(userId: string, scopeType: string, scopeId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") return true;

  if (scopeType === "portfolio") {
    return scopeId === userId;
  }

  if (scopeType === "listing") {
    const row = await prisma.shortTermListing.findFirst({
      where: { id: scopeId, ownerId: userId },
      select: { id: true },
    });
    return !!row;
  }

  return false;
}
