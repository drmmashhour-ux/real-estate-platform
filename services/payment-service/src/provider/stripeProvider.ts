import type {
  PaymentProvider,
  CreateIntentParams,
  CreateIntentResult,
  CaptureIntentParams,
  RefundParams,
  RefundResult,
  CreatePayoutParams,
  CreatePayoutResult,
} from "./types.js";

/**
 * Stripe integration adapter.
 * Requires: npm install stripe and STRIPE_SECRET_KEY (and optionally STRIPE_WEBHOOK_SECRET).
 * Export and use when STRIPE_SECRET_KEY is set; otherwise use MockPaymentProvider.
 */
export function createStripeProvider(secretKey: string): PaymentProvider {
  return {
    async createIntent(_params: CreateIntentParams): Promise<CreateIntentResult> {
      throw new Error(
        "Stripe PaymentIntents for client-side card collection are disabled (PCI). Use Checkout Sessions only.",
      );
    },

    async captureIntent(params: CaptureIntentParams): Promise<void> {
      const Stripe = await import("stripe").then((m) => m.default);
      const stripe = new Stripe(secretKey);
      await stripe.paymentIntents.capture(params.providerIntentId);
    },

    async cancelIntent(providerIntentId: string): Promise<void> {
      const Stripe = await import("stripe").then((m) => m.default);
      const stripe = new Stripe(secretKey);
      await stripe.paymentIntents.cancel(providerIntentId);
    },

    async refund(params: RefundParams): Promise<RefundResult> {
      const Stripe = await import("stripe").then((m) => m.default);
      const stripe = new Stripe(secretKey);
      const refund = await stripe.refunds.create({
        payment_intent: params.providerPaymentId,
        ...(params.amountCents != null && { amount: params.amountCents }),
        reason: params.reason === "duplicate" ? "duplicate" : "requested_by_customer",
      });
      return {
        refundId: refund.id,
        providerRefundId: refund.id,
      };
    },

    async createPayout(params: CreatePayoutParams): Promise<CreatePayoutResult> {
      const Stripe = await import("stripe").then((m) => m.default);
      const stripe = new Stripe(secretKey);
      const destination = params.destinationId ?? params.hostId;
      const transfer = await stripe.transfers.create({
        amount: params.amountCents,
        currency: params.currency,
        destination: destination,
        metadata: params.metadata,
      });
      return {
        payoutId: transfer.id,
        providerPayoutId: transfer.id,
      };
    },
  };
}
