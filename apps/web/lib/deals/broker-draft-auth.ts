import type { Deal } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { requireBrokerDealAccess } from "@/lib/broker/residential-access";
import { prisma } from "@/lib/db";

export type BrokerDealAuthOk = {
  userId: string;
  role: string;
  deal: Deal;
};

/**
 * API guard: licensed broker (or admin) with access to the deal — server-only.
 */
export async function authenticateBrokerDealRoute(dealId: string): Promise<
  { ok: true } & BrokerDealAuthOk | { ok: false; response: Response }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return { ok: false, response: Response.json({ error: "Broker access only" }, { status: 403 }) };
  }
  const deal = await requireBrokerDealAccess(userId, dealId, user.role === "ADMIN");
  if (!deal) {
    return { ok: false, response: Response.json({ error: "Not found" }, { status: 404 }) };
  }
  return { ok: true, userId, role: user.role, deal };
}
