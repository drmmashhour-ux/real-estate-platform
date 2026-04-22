import { prisma } from "@/lib/db";
import { logTimelineEvent } from "@/modules/transactions/transaction-timeline.service";

export async function logClosingTimeline(transactionId: string | null | undefined, eventType: string, summary: string) {
  if (!transactionId) return;
  await logTimelineEvent(prisma, transactionId, eventType.slice(0, 64), summary.slice(0, 8000));
}
