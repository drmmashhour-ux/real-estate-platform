import { prisma } from "@/lib/db";

export const FREE_BROKER_VISIBLE_LEADS = 3;

/** Whether a mortgage request is in the broker’s “visible” slice (latest N for free tier). */
export async function isMortgageLeadUnlockedForBroker(
  brokerId: string,
  requestId: string,
  plan: string
): Promise<boolean> {
  if (plan === "pro") return true;
  const top = await prisma.mortgageRequest.findMany({
    where: { brokerId },
    orderBy: { createdAt: "desc" },
    take: FREE_BROKER_VISIBLE_LEADS,
    select: { id: true },
  });
  return top.some((r) => r.id === requestId);
}
