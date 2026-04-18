/**
 * Durable revenue audit rows — complements PlatformPayment; does not replace it.
 */

import { prisma } from "@/lib/db";

export type RevenueEventType =
  | "lead_unlock"
  | "booking_fee"
  | "subscription"
  | "boost"
  | "other";

export async function recordRevenueEventLedger(input: {
  type: RevenueEventType;
  amountCents: number;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const amount = input.amountCents / 100;
  if (!Number.isFinite(amount)) return;
  await prisma.revenueEvent
    .create({
      data: {
        eventType: input.type,
        amount,
        userId: input.userId ?? undefined,
        metadataJson: (input.metadata ?? {}) as object,
      },
    })
    .catch(() => {});
}
