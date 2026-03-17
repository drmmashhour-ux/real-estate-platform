/**
 * Integration hooks for a payment provider (e.g. Stripe, Adyen).
 * Implement this interface and inject into the payment service to process real payments.
 */

export interface CreateIntentParams {
  amountCents: number;
  currency: string;
  metadata: Record<string, string>;
  /** Optional: idempotency key */
  idempotencyKey?: string;
}

export interface CreateIntentResult {
  intentId: string;
  clientSecret: string;
  /** Provider's raw intent ID (e.g. Stripe pi_xxx) */
  providerIntentId: string;
}

export interface CaptureIntentParams {
  providerIntentId: string;
}

export interface RefundParams {
  /** Provider's payment/intent ID to refund */
  providerPaymentId: string;
  amountCents?: number;
  reason?: string;
}

export interface RefundResult {
  refundId: string;
  providerRefundId: string;
}

export interface CreatePayoutParams {
  hostId: string;
  amountCents: number;
  currency: string;
  /** Provider-specific destination (e.g. Stripe connect account ID, bank account) */
  destinationId?: string;
  metadata?: Record<string, string>;
}

export interface CreatePayoutResult {
  payoutId: string;
  providerPayoutId: string;
}

export interface PaymentProvider {
  /** Create a payment intent (authorization/hold). Returns clientSecret for frontend. */
  createIntent(params: CreateIntentParams): Promise<CreateIntentResult>;

  /** Capture a previously created intent (confirm payment). */
  captureIntent(params: CaptureIntentParams): Promise<void>;

  /** Cancel an intent that has not been captured. */
  cancelIntent(providerIntentId: string): Promise<void>;

  /** Refund a captured payment (full or partial). */
  refund(params: RefundParams): Promise<RefundResult>;

  /** Prepare/send payout to host (e.g. Stripe Connect transfer). */
  createPayout(params: CreatePayoutParams): Promise<CreatePayoutResult>;
}
