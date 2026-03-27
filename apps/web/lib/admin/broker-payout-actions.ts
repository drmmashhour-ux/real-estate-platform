import type { BrokerPayoutStatus } from "@prisma/client";

/** Payout workflow: approve → mark paid (manual recording only). */
export const PAYOUT_TRANSITIONS: Record<
  BrokerPayoutStatus,
  Partial<Record<"approve" | "mark_paid" | "mark_failed" | "cancel", BrokerPayoutStatus>>
> = {
  PENDING: {
    approve: "APPROVED",
    mark_failed: "FAILED",
    cancel: "CANCELLED",
  },
  APPROVED: {
    mark_paid: "PAID",
    mark_failed: "FAILED",
    cancel: "CANCELLED",
  },
  PAID: {},
  FAILED: {},
  CANCELLED: {},
};

export function nextPayoutStatus(
  current: BrokerPayoutStatus,
  action: "approve" | "mark_paid" | "mark_failed" | "cancel"
): BrokerPayoutStatus | null {
  return PAYOUT_TRANSITIONS[current][action] ?? null;
}
