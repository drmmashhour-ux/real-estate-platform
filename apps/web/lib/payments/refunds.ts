import type { BookingMoneyBreakdown } from "@/lib/payments/bnhub-money-types";

export type RefundPayoutGuard = {
  allowTransfer: boolean;
  reason: string | null;
  adjustedHostPayoutCents: number | null;
};

/**
 * Refund-aware guardrails before executing a Connect transfer.
 * Full refund / refunded flag → block. Partial refund before payout → reduce host payout when breakdown is available.
 * Payout already sent → never auto claw back (admin reconciliation only).
 */
export function refundGuardForPayout(input: {
  bookingRefunded: boolean;
  paymentStatusRefunded: boolean;
  refundPending: boolean;
  partialRefundCents: number;
  moneyBreakdown: BookingMoneyBreakdown | null;
  existingTransferId: string | null;
}): RefundPayoutGuard {
  if (input.existingTransferId) {
    return { allowTransfer: false, reason: "transfer_already_sent", adjustedHostPayoutCents: null };
  }
  if (input.refundPending) {
    return { allowTransfer: false, reason: "refund_pending", adjustedHostPayoutCents: null };
  }
  if (input.bookingRefunded || input.paymentStatusRefunded) {
    return { allowTransfer: false, reason: "booking_refunded", adjustedHostPayoutCents: 0 };
  }
  if (input.partialRefundCents <= 0 || !input.moneyBreakdown) {
    return { allowTransfer: true, reason: null, adjustedHostPayoutCents: null };
  }
  const cap = Math.max(0, input.moneyBreakdown.hostPayoutCents - input.partialRefundCents);
  if (cap <= 0) {
    return { allowTransfer: false, reason: "refund_exceeds_host_payout", adjustedHostPayoutCents: 0 };
  }
  return { allowTransfer: true, reason: "partial_refund_reduced_payout", adjustedHostPayoutCents: cap };
}

export function calculateRefundableCents(input: {
  totalChargeCents: number;
  alreadyRefundedCents: number;
}): { refundableCents: number } {
  const refundableCents = Math.max(0, input.totalChargeCents - Math.max(0, input.alreadyRefundedCents));
  return { refundableCents };
}
