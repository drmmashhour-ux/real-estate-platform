import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { LECIPM_PATH_HEADER } from "@/lib/auth/session-cookie";
import { getGuestId } from "@/lib/auth/session";
import { PlatformRole } from "@prisma/client";

/**
 * Server guard for `/investor/*` private routes (not pitch or login).
 */
export async function requireInvestorUser(): Promise<{ userId: string; email: string | null }> {
  const userId = await getGuestId();
  if (!userId) {
    const path = (await headers()).get(LECIPM_PATH_HEADER) ?? "/investor/dashboard";
    redirect(`/investor/login?next=${encodeURIComponent(path)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });
  if (!user || user.role !== PlatformRole.INVESTOR) {
    redirect(`/investor/login?next=${encodeURIComponent("/investor/dashboard")}`);
  }

  return { userId: user.id, email: user.email };
}
