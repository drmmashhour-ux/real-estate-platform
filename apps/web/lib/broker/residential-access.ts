import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { brokerResidentialFlags } from "@/config/feature-flags";

export type BrokerSession = {
  userId: string;
  role: PlatformRole;
};

/** Licensed broker or admin; optional dashboard feature flag. */
export async function requireBrokerResidentialSession(opts?: { requireDashboardFlag?: boolean }): Promise<
  BrokerSession | { response: Response }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { response: Response.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return { response: Response.json({ error: "Broker access only" }, { status: 403 }) };
  }
  if (opts?.requireDashboardFlag && !brokerResidentialFlags.brokerResidentialDashboardV1) {
    return { response: Response.json({ error: "Residential dashboard disabled" }, { status: 403 }) };
  }
  return { userId: user.id, role: user.role };
}

export async function requireBrokerDealAccess(brokerUserId: string, dealId: string, isAdmin: boolean) {
  const deal = await prisma.deal.findFirst({
    where: isAdmin ? { id: dealId } : { id: dealId, brokerId: brokerUserId },
  });
  return deal;
}
