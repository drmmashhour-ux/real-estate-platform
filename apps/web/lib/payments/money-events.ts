import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";

export type MoneyEventType =
  | "booking_checkout_created"
  | "booking_paid"
  | "host_payout_eligible"
  | "host_payout_sent"
  | "host_payout_failed"
  | "host_payout_manual"
  | "booking_refunded";

export interface MoneyEvent {
  type: MoneyEventType;
  bookingId: string;
  hostUserId?: string;
  amountCents?: number;
  metadata?: Record<string, unknown>;
}

export async function persistMoneyEvent(event: MoneyEvent): Promise<void> {
  await persistLaunchEvent(
    `bnhub_money:${event.type}`,
    {
      bookingId: event.bookingId,
      hostUserId: event.hostUserId ?? null,
      amountCents: event.amountCents ?? null,
      ...(event.metadata ?? {}),
    },
    { userId: event.hostUserId ?? null }
  );
}
