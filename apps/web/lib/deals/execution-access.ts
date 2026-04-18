import type { Deal } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * Deal visible to buyer, seller, or assigned broker (same as core deal APIs).
 */
export async function findDealForParticipant(dealId: string, userId: string): Promise<Deal | null> {
  return prisma.deal.findFirst({
    where: {
      id: dealId,
      OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
    },
  });
}

export async function loadDealWithActor(dealId: string, userId: string) {
  const [deal, user] = await Promise.all([
    findDealForParticipant(dealId, userId),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } }),
  ]);
  return { deal, user };
}

/** Broker-led execution mutations: assigned broker on the deal, or admin. */
export function canMutateExecution(userId: string, role: string | undefined | null, deal: { brokerId: string | null }): boolean {
  if (role === "ADMIN") return true;
  if (role === "BROKER" && deal.brokerId === userId) return true;
  return false;
}

/** Buyer, seller, assigned broker, or admin path via broker routes — for read-only party APIs. */
export async function authenticateDealParticipantRoute(dealId: string): Promise<
  { ok: true; userId: string; role: string; deal: Deal } | { ok: false; response: Response }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const deal = await findDealForParticipant(dealId, userId);
  if (!deal) {
    return { ok: false, response: Response.json({ error: "Not found" }, { status: 404 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return { ok: false, response: Response.json({ error: "Not found" }, { status: 404 }) };
  }
  return { ok: true, userId, role: user.role, deal };
}
