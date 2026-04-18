import type { DealPaymentProviderAdapter, CreatePaymentRequestInput, PaymentProviderResult } from "../payment-provider.interface";

/**
 * Placeholder for Stripe Payment Links / Invoices — wire to your Stripe integration when approved.
 * V1: returns not_configured unless STRIPE_PAYMENT_REQUEST_ENABLED=1.
 */
export const stripePaymentRequestAdapter: DealPaymentProviderAdapter = {
  key: "stripe_request",
  async createPaymentRequest(_input: CreatePaymentRequestInput): Promise<PaymentProviderResult> {
    if (process.env.STRIPE_PAYMENT_REQUEST_ENABLED !== "1") {
      return { ok: false, message: "Stripe payment request adapter not enabled in this environment." };
    }
    return { ok: false, message: "Stripe request path not implemented — configure checkout or invoice creation." };
  },
};
