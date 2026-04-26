import { PlatformRole } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";

export async function requireInvestorApiSession(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, status: 401, error: "Sign in required" };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || user.role !== PlatformRole.INVESTOR) {
    return { ok: false, status: 403, error: "Investor portal access only" };
  }
  return { ok: true, userId: user.id };
}
