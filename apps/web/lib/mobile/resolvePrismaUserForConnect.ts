import { prisma } from "@/lib/db";
import type { MobileAuthUser } from "@/lib/mobile/mobileAuth";

/**
 * Stripe Connect is stored on Prisma `User`. Maps Supabase/JWT identity to a Prisma row by id or email.
 */
export async function resolvePrismaUserIdForConnect(auth: MobileAuthUser): Promise<string | null> {
  const byId = await prisma.user.findUnique({ where: { id: auth.id }, select: { id: true } });
  if (byId) return byId.id;
  if (auth.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true },
    });
    if (byEmail) return byEmail.id;
  }
  return null;
}
