# Syria Payment Provider Stubs

This module defines the Syria-only provider interface and the disabled stub implementations:

- `provider_stub`
- `provider_qnb_stub`
- `provider_chamcash_stub`

All providers expose `createPaymentIntent`, `verifyPayment`, `createPayout`, `handleWebhook`, and `healthCheck`, but none connects to live banking, Mastercard, Cham Cash, QNB Syria, card, bank, or Stripe rails. The global read-only guard requires mock mode and rejects live provider keys plus `FEATURE_SYRIA_PROVIDER_QNB`, `FEATURE_SYRIA_PROVIDER_CHAMCASH`, and `FEATURE_SYRIA_PAYOUTS` when set to a truthy value.
