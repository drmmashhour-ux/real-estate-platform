import type { DealPaymentProviderAdapter, PaymentProviderResult } from "../payment-provider.interface";

/** Manual workflow — no external API; records intent only. */
export const manualTrustAdapter: DealPaymentProviderAdapter = {
  key: "manual",
  async createPaymentRequest() {
    return { ok: true, externalStatus: "manual_intent_logged" };
  },
};
