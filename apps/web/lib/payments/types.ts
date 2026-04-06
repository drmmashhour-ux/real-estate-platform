/**
 * Unified multi-provider payment model (orchestration layer).
 * Card data never touches LECIPM — only hosted checkout (Stripe / Clover).
 */

export type PaymentProvider = "stripe" | "clover";

/** High-level commerce intent routed by the orchestrator. */
export type OrchestratedPaymentType = "booking" | "subscription" | "listing_upgrade" | "office_payment";

/** @alias OrchestratedPaymentType — unified public name */
export type PaymentType = OrchestratedPaymentType;

export type OrchestratedPaymentStatus =
  | "pending"
  | "requires_action"
  | "succeeded"
  | "failed"
  | "refunded";

/** @alias OrchestratedPaymentStatus */
export type PaymentStatus = OrchestratedPaymentStatus;

export type OrchestratedPayoutStatus = "not_ready" | "scheduled" | "sent" | "failed";

/** @alias OrchestratedPayoutStatus */
export type PayoutStatus = OrchestratedPayoutStatus;

export type CreatePaymentSessionInput = {
  paymentType: OrchestratedPaymentType;
  userId: string;
  /** Required for `subscription` path (workspace checkout). */
  userEmail?: string | null;
  bookingId?: string | null;
  listingId?: string | null;
  amountCents: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  description?: string;
  /** Stripe Connect (BNHub booking) — required when `paymentType === "booking"` and using Stripe. */
  stripeConnect?: {
    destinationAccountId: string;
    applicationFeeAmount: number;
    bnhubPlatformFeeCents?: number;
    bnhubHostPayoutCents?: number;
  };
  /** Extra provider metadata (validated — no PII / PAN). */
  metadata?: Record<string, string>;
  /** Optional workspace scope for subscription checkout. */
  workspaceId?: string | null;
  planCode?: string | null;
  priceId?: string | null;
};

export type CreatePaymentSessionResult =
  | {
      ok: true;
      provider: PaymentProvider;
      url: string;
      orchestratedPaymentId: string;
      providerPaymentId: string | null;
    }
  | { ok: false; error: string; orchestratedPaymentId?: string };

/** BNHub market-derived rail: card checkout vs offline/manual settlement tracking. */
export type ActivePaymentMode = "online" | "manual";

export interface PaymentResolutionContext {
  marketCode: string;
  bookingMode: "instant" | "request";
  paymentMode: ActivePaymentMode;
}

export * from "./bnhub-money-types";
