import { prisma } from "@/lib/db";
import { logTimelineEvent } from "@/modules/transactions/transaction-timeline.service";

/** When the pipeline deal is linked to an SD transaction, mirror key capital events on the transaction timeline. */
export async function logDealCapitalTimeline(dealId: string, eventType: string, summary: string): Promise<void> {
  const deal = await prisma.lecipmPipelineDeal.findUnique({
    where: { id: dealId },
    select: { transactionId: true },
  });
  if (!deal?.transactionId) return;
  await logTimelineEvent(prisma, deal.transactionId, eventType.slice(0, 64), summary.slice(0, 8000));
}
