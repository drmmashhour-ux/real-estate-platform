/**
 * Deal coordination — authz for broker-led Québec residential workflows.
 * LECIPM is not a lender or notary; coordination is logged and broker-controlled.
 */

import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type DealPartyGate = {
  ok: true;
  deal: {
    id: string;
    brokerId: string | null;
    buyerId: string;
    sellerId: string;
    status: string;
  };
  userId: string;
  role: PlatformRole;
} | { ok: false; status: number; error: string };

export async function loadDealForCoordination(dealId: string, userId: string): Promise<DealPartyGate> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, accountStatus: true },
  });
  if (!user || user.accountStatus !== "ACTIVE") {
    return { ok: false, status: 401, error: "Sign in required" };
  }

  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
    select: { id: true, brokerId: true, buyerId: true, sellerId: true, status: true },
  });
  if (!deal) {
    return { ok: false, status: 404, error: "Deal not found" };
  }

  return { ok: true, deal, userId, role: user.role };
}

export function canMutateCoordination(g: DealPartyGate): boolean {
  if (!g.ok) return false;
  if (g.role === "ADMIN") return true;
  return g.role === "BROKER" && g.deal.brokerId != null && g.deal.brokerId === g.userId;
}

/** Broker/admin-only mutations (buyer/seller read-only for most coordination writes). */
export function assertBrokerControlledWrite(g: DealPartyGate): boolean {
  return canMutateCoordination(g);
}
