# BNHub Stripe Production Checklist

## Current Model

- Charge type: Stripe Connect destination charges
- Checkout: Stripe-hosted Checkout Sessions
- Booking confirmation source of truth: webhooks, never `success_url`
- Host payout model: connected account payout lifecycle tracked separately from guest payment lifecycle
- Optional settlement merchant support: `payment_intent_data.on_behalf_of` behind `STRIPE_CONNECT_USE_ON_BEHALF_OF=1`

## Core Metadata

Booking Checkout Sessions should continue to include server-controlled metadata:

- `bookingId`
- `listingId`
- `userId`
- `paymentType`
- `bnhubReservationPaymentId`
- `connectDestination`
- `applicationFeeCents`
- `bnhubPlatformFeeCents`
- `bnhubHostPayoutCents`
- `onBehalfOfAccountId` when enabled

## Webhook Coverage

### Implemented

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.payment_failed`
- `charge.refunded`
- `account.updated`
- `account.external_account.updated`
- `payout.paid`
- `payout.failed`

### Optional / still useful to evaluate

- `capability.updated`
- `transfer.created`
- `payout.created`

## Booking Fulfillment Rules

- Confirm booking only when Stripe reports the Checkout Session as paid.
- For immediate payment methods:
  - use `checkout.session.completed` with `payment_status=paid`
- For delayed payment methods:
  - use `checkout.session.async_payment_succeeded`
- On delayed payment failure:
  - use `checkout.session.async_payment_failed`
- Do not fulfill from client redirects.

## Host Connect Readiness

Before allowing BNHub booking checkout for a host listing, verify:

- `details_submitted === true`
- `charges_enabled === true`
- `payouts_enabled === true`
- `capabilities.transfers === 'active'` when available from Stripe account data

Connect status should be refreshed from:

- explicit status sync route
- `account.updated`
- `account.external_account.updated`
- payout-related webhook handling

## Payment Lifecycle Model

### Stage 1: Guest payment

- Stripe object(s): Checkout Session / PaymentIntent / Charge
- Product meaning: the guest paid the platform
- BNHub state examples:
  - payment processing
  - payment confirmed
  - payment failed

### Stage 2: Host allocation / transfer logic

- Product meaning: funds are assigned toward the host side after platform fee logic
- BNHub state examples:
  - payout scheduled
  - payout on hold
  - payout released

### Stage 3: Connected account payout to host bank

- Stripe object(s): Payout on connected account
- Product meaning: Stripe is sending money from the connected account balance to the host bank account
- BNHub state examples:
  - payout paid
  - payout failed

Important:

- guest payment success is not the same as host bank payout completion
- payout events must not overwrite booking payment truth

## UI Language Rules

Guest-facing wording should use:

- `Payment confirmed`
- `Payment processing`
- `Payment action needed`
- `Payment failed`

Host-facing wording should use:

- `Guest paid`
- `Payout scheduled`
- `Payout on hold`
- `Payout paid`
- `Payout failed`

Avoid phrasing that implies the host already received bank funds immediately after guest checkout.

## Refunds And Disputes

- Destination charges keep dispute/refund responsibility on the platform side.
- Refund and dispute state should remain separate from payout/bank-settlement state.
- If payout risk emerges later, update payout hold/release state without rewriting payment confirmation history.

## `on_behalf_of` Guidance

- Keep destination charges as the BNHub default.
- Enable `payment_intent_data.on_behalf_of` only when required by Stripe support, settlement merchant rules, or cross-border conditions.
- Current implementation supports this via:
  - env: `STRIPE_CONNECT_USE_ON_BEHALF_OF=1`

## Testing Checklist

### Automated / code-side

- booking checkout success
- payment failure
- refund handling
- webhook replay / duplicate safety

### Manual Stripe test mode

- host onboarding incomplete
- host onboarding complete
- guest card payment success
- delayed payment success
- delayed payment failure
- payout failed scenario
- `on_behalf_of` disabled
- `on_behalf_of` enabled if cross-border is relevant

## Production Environment Checklist

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Connect enabled on the Stripe platform account
- Host connected accounts can request:
  - `card_payments`
  - `transfers`
- Production webhook endpoint subscribed to required events
- Live and test mode credentials clearly separated

## Open Questions For Stripe Support

Forward these remaining items to Stripe if they are still unresolved:

1. For a Canada-based BNHub marketplace using destination charges and Express accounts, when is `payment_intent_data.on_behalf_of` required versus optional?
2. If hosts may later be outside Canada, what exact cross-border conditions require `on_behalf_of` and any additional merchant/recipient capability setup?
3. Should BNHub subscribe to `capability.updated` in addition to `account.updated` for the most reliable host readiness tracking?
4. For destination charges in this marketplace shape, which event is the strongest source of truth for booking fulfillment across immediate and delayed methods:
   - `checkout.session.completed` with `payment_status=paid`
   - `checkout.session.async_payment_succeeded`
   - `payment_intent.succeeded`
5. For host payout visibility, what is Stripe’s recommended event model for distinguishing:
   - platform payment succeeded
   - connected account payout paid
   - connected account payout failed
6. In a Canada-first rollout, are there any country-specific restrictions or recommended defaults for Express accounts, destination charges, and payout schedules?

## Final Notes

- BNHub should remain on destination charges unless Stripe support gives a strong reason to move to direct charges.
- Webhooks remain the single source of truth for booking/payment fulfillment.
- Payment confirmation and payout completion should continue to be modeled and displayed as different stages.
