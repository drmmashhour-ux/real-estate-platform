# Stripe validation (BNHub guest checkout)

## Correlating logs

Use **`[bnhub]`** log lines to tie API → webhook:

| Phase | Log | Fields |
|-------|-----|--------|
| Checkout session created | `[bnhub] guest_booking checkout_session_created` | `bookingId`, `sessionId`, `listingId`, `amountCents`, `paymentIntentId: null` (PI exists after payment) |
| Webhook received | `[bnhub] guest_booking webhook` | `phase: checkout_session_received`, `bookingId`, `sessionId`, `paymentIntentId` (if expanded), `paymentStatus` |
| Marked paid | `[bnhub] guest_booking webhook` | `phase: marked_paid`, `bookingId`, `sessionId`, `paymentIntentId` |
| Already paid / replay | `[bnhub] guest_booking webhook` | `phase: idempotent_skip_already_paid`, `duplicateCheckoutSessionReplay`, `paymentIntentId` |

No secrets are logged.

## Local webhook forwarding

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Use the CLI’s **webhook signing secret** in `STRIPE_WEBHOOK_SECRET` for local dev (or Dashboard test endpoint secret).

## Test cards

Use [Stripe test cards](https://stripe.com/docs/testing): e.g. `4242424242424242` succeeds; use decline cards to verify **no** `paid` without successful payment.

## Lifecycle

1. App: `POST /api/stripe/checkout` with `{ bookingId }` only → `{ url, sessionId }`.
2. User pays on Stripe-hosted Checkout.
3. Stripe sends `checkout.session.completed` → webhook marks booking **paid** idempotently.
4. Duplicate events → `idempotent_skip_already_paid` without double-settling.
5. Stale session id mismatch → `checkout_session_mismatch` (logged, no corrupt paid state).

## Scripts

- `pnpm run stripe:verify` — API key works.
- `pnpm run validate:bnhub-stripe` — deeper E2E (Prisma-oriented flows).
