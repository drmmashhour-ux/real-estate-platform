import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireBrokerCrmApiUser() {
  const userId = await getGuestId();
  if (!userId) return { user: null as const, error: "Unauthorized" as const, status: 401 as const };
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return { user: null as const, error: "Forbidden" as const, status: 403 as const };
  }
  return { user, error: null as const, status: null as const };
}
