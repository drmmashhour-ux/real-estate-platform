/**
 * BNHub booking ledger — canonical TypeScript views over `Payment` + `OrchestratedPayout` (+ manual queue).
 * Amounts are always in minor units (cents). Currency is CAD for BNHub v1.
 */

export type BookingPaymentStatus =
  | "pending"
  | "checkout_created"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type HostPayoutStatus =
  | "not_ready"
  | "eligible"
  | "queued"
  | "in_transit"
  | "paid"
  | "failed"
  | "reversed"
  | "manual";

export interface BookingMoneyBreakdown {
  bookingId: string;
  currency: "cad";
  subtotalCents: number;
  cleaningFeeCents: number;
  taxesCents: number;
  guestServiceFeeCents: number;
  hostPayoutCents: number;
  platformRevenueCents: number;
  totalChargeCents: number;
}

export interface HostPayoutRecord {
  id: string;
  bookingId: string;
  hostUserId: string;
  connectedAccountId: string | null;
  amountCents: number;
  currency: "cad";
  status: HostPayoutStatus;
  payoutMethod: "stripe_connect" | "manual";
  stripeTransferId: string | null;
  stripePayoutId: string | null;
  failureReason: string | null;
  availableAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
