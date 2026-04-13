import { DealRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Flags blocked / long-running financing or notary gaps for broker attention — no auto-send. */
export async function listEscalations(dealId: string) {
  const [blocked, overdue] = await Promise.all([
    prisma.dealRequest.findMany({
      where: { dealId, status: DealRequestStatus.BLOCKED },
    }),
    prisma.dealRequest.findMany({
      where: { dealId, status: DealRequestStatus.OVERDUE },
    }),
  ]);
  return { blocked, overdue };
}
