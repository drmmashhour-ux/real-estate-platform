import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export type SafeSessionUser = {
  id: string;
  email: string;
  role: string;
};

/**
 * Minimal user for authorization and auditing (no secrets).
 */
export async function getSafeSessionUser(): Promise<SafeSessionUser | null> {
  const userId = await getGuestId();
  if (!userId) return null;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  return u ?? null;
}
