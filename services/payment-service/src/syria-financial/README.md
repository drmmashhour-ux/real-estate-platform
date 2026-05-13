# Syria Financial Foundation

This namespace prepares SYBNB financial architecture for future Syrian provider integrations while keeping all live payment activity disabled.

## Boundaries

- Lives only inside `services/payment-service/src/syria-financial`.
- Does not import from `apps/web`.
- Does not mount public routes.
- Does not connect to Stripe, Cham Cash, QNB Syria, Mastercard, or bank transfer rails.
- Uses `FEATURE_SYRIA_*` flags, all off by default.

## Modules

- `wallet` — internal wallet and ledger-ready references.
- `transactions` — provider-agnostic transaction status engine.
- `payouts` — payout preparation only.
- `providers` — non-live provider stubs.
- `audit` — immutable audit log records.
- `events` — provider/payment event normalization.
- `merchant-verification` — merchant, KYC, and document reference foundation.
- `risk` — passive risk signals.
- `admin` — internal dashboard data structures.
- `api` — correlation, idempotency, validation, safe logging, and error helpers.
