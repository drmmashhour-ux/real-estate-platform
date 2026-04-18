/**
 * LECIPM Production Infrastructure v1 — resolve current session (Prisma user via opaque session cookie).
 */
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export type SessionUser = {
  id: string;
  email: string;
  role: PlatformRole;
};

export async function getSession(): Promise<{ user: SessionUser | null }> {
  const userId = await getGuestId();
  if (!userId) return { user: null };
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) return { user: null };
  return { user: { id: user.id, email: user.email, role: user.role } };
}
