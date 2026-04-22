import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[transaction.timeline.event]";

export async function logTimelineEvent(
  delegate: Prisma.TransactionClient | typeof prisma,
  transactionId: string,
  eventType: string,
  summary: string
): Promise<void> {
  await delegate.lecipmSdTimelineEvent.create({
    data: {
      transactionId,
      eventType,
      summary,
    },
  });
  logInfo(`${TAG}`, { transactionId, eventType });
}

export async function listTimeline(transactionId: string) {
  return prisma.lecipmSdTimelineEvent.findMany({
    where: { transactionId },
    orderBy: { createdAt: "asc" },
  });
}
