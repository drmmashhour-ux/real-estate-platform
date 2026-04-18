import type { DealPaymentProviderAdapter, CreatePaymentRequestInput, PaymentProviderResult } from "../payment-provider.interface";

/** Notary-coordinated funds — status from broker/notary attestation, not automated. */
export const notaryFundsAdapter: DealPaymentProviderAdapter = {
  key: "notary_funds",
  async createPaymentRequest(_input: CreatePaymentRequestInput): Promise<PaymentProviderResult> {
    return {
      ok: true,
      externalStatus: "notary_coordination",
      message: "Funds follow notarial instructions — use confirmations with evidence type notary_attestation.",
    };
  },
};
