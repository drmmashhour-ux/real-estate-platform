import type { DealPaymentProviderAdapter, CreatePaymentRequestInput, PaymentProviderResult } from "../payment-provider.interface";

/** Future escrow partner — auditable handoff only. */
export const escrowPlaceholderAdapter: DealPaymentProviderAdapter = {
  key: "escrow_placeholder",
  async createPaymentRequest(_input: CreatePaymentRequestInput): Promise<PaymentProviderResult> {
    return {
      ok: true,
      providerReference: `escrow-placeholder-${Date.now()}`,
      externalStatus: "awaiting_partner_integration",
      message: "No live escrow API — record status manually when partner confirms.",
    };
  },
};
