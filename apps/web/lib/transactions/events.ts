import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { TransactionEventType } from "./constants";

export async function recordTransactionEvent(
  transactionId: string,
  eventType: TransactionEventType | string,
  eventData: Record<string, unknown> | null,
  createdById: string | null
): Promise<void> {
  await prisma.transactionEvent.create({
    data: {
      transactionId,
      eventType,
      eventData: (eventData ?? undefined) as Prisma.InputJsonValue | undefined,
      createdById: createdById ?? undefined,
    },
  });
}
