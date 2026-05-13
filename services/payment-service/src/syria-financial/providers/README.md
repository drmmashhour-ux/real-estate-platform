# Syria Payment Provider Stubs

This module defines the Syria-only provider interface and the disabled stub implementations:

- `provider_stub`
- `provider_qnb_stub`
- `provider_chamcash_stub`

All providers expose `createPaymentIntent`, `verifyPayment`, `createPayout`, `handleWebhook`, and `healthCheck`, but none connects to live banking, Mastercard, Cham Cash, QNB Syria, or Stripe rails. QNB and Cham Cash stubs are additionally protected by `FEATURE_SYRIA_PROVIDER_QNB` and `FEATURE_SYRIA_PROVIDER_CHAMCASH`, both off by default.
