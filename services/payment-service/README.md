# Payment Service

Booking payment processing with escrow-style hold, capture, refunds, payout preparation, and transaction history. Integrates with a payment provider (Stripe or mock).

## Features

- **Payment intent (removed, PCI)** — `POST /v1/payments/intent` returns **410 Gone**. Card data must never touch this service; the platform uses **Stripe Checkout Sessions** only.
- **Confirm (capture)** — Capture a held intent; marks payment COMPLETED and creates a **payout preparation** record for the host.
- **Refunds** — Full or partial refund; updates payment to REFUNDED and appends to transaction history.
- **Transaction history** — List all transactions (INTENT_CREATED, INTENT_HELD, CAPTURED, REFUNDED, PAYOUT_PREPARED, PAYOUT_SENT) with filters by `paymentId`, `bookingId`, `type`, plus pagination.

## APIs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/payments/intent` | **Disabled (410)** — use Stripe Checkout from the platform app |
| POST | `/v1/payments/confirm` | Capture payment (body: `paymentId`, optional `intentId`) |
| POST | `/v1/payments/refund` | Refund (body: `paymentId`, optional `amountCents`, `reason`) |
| GET | `/v1/payments/history` | Transaction history (query: `paymentId`, `bookingId`, `type`, `limit`, `offset`) |

## Payment provider integration

The service uses a **provider interface** (`src/provider/types.ts`). It is currently locked to mock mode:

- **Mock provider** — The only resolvable provider. Simulates capture/refund in memory; `createIntent` throws (same PCI posture as production).
- **Stripe provider** — Code remains present for future review, but provider resolution rejects `STRIPE_SECRET_KEY` and non-`mock` `SYBNB_FINANCIAL_MODE` values.

To plug in another provider (e.g. Adyen), implement `PaymentProvider` and register it in `src/provider/index.ts` (e.g. via env or config).

## Syria financial foundation

The architecture-only Syria foundation lives under `src/syria-financial`. It prepares wallet, transaction, payout, provider stub, audit, event, merchant verification, risk, admin, and API hardening modules without mounting public routes or executing live payments.

All Syria financial systems are off by default:

- `FEATURE_SYRIA_WALLET`
- `FEATURE_SYRIA_PAYOUTS`
- `FEATURE_SYRIA_KYC`
- `FEATURE_SYRIA_PROVIDER_QNB`
- `FEATURE_SYRIA_PROVIDER_CHAMCASH`
- `FEATURE_SYRIA_RISK_ENGINE`

The only Syria providers are stubs: `provider_stub`, `provider_qnb_stub`, and `provider_chamcash_stub`.

## Configuration

- `PORT` — default `3006`
- `DATABASE_URL` — PostgreSQL connection string (required; same DB as booking-service for shared `Payment`/`Booking`).
- `STRIPE_SECRET_KEY` — Optional. When set, Stripe is used; otherwise the mock provider is used.

## Database

Schema includes BNHub `Payment`, `Booking`, `User`, `ShortTermListing` (for shared DB) plus:

- **PaymentIntent** — Escrow intent (CREATED → HELD → CAPTURED | CANCELLED | FAILED).
- **Transaction** — Audit log (type, paymentId, amountCents, providerRef, createdAt).
- **Payout** / **PayoutPayment** — Payout preparation per host (links payments to a payout batch).

Run `npx prisma db push` or migrations from this service when using a shared database.

## Scripts

```bash
npm run build
npm run dev
npm run start
npm run db:generate
npm run db:push
npm run db:migrate
```

## Reference

- [API Architecture Blueprint](../../docs/LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Database Blueprint](../../docs/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) §6.
- Build order: Phase 6 — [Build Order](../../docs/LECIPM-BUILD-ORDER.md).
