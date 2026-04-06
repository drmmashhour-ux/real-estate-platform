import { prisma } from "@/lib/db";
import type { MobileAuthUser } from "@/lib/mobile/mobileAuth";

/** Prisma `User.id` for identity documents, or null if no linked row. */
export async function resolvePrismaIdentitySubjectUserId(user: MobileAuthUser): Promise<string | null> {
  const row = await prisma.user.findFirst({
    where: {
      OR: [{ id: user.id }, ...(user.email ? [{ email: user.email }] : [])],
    },
    select: { id: true },
  });
  return row?.id ?? null;
}
