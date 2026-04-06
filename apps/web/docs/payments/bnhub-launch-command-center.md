# BNHub Launch Command Center

## Purpose

Use this page as the single launch-day checklist for BNHub soft launch.

It combines:

- Stripe setup
- host onboarding readiness
- booking payment validation
- payout monitoring
- refunds and disputes handling
- support triage

## Launch Mode

- rollout type: soft launch
- country: Canada-first
- hosts: trusted small cohort only
- charge type: destination charges
- `on_behalf_of`: off by default
- booking confirmation: webhook only

## Before Opening Payments

### Stripe Platform

- Connect enabled on Stripe live account
- production webhook endpoint created
- production webhook endpoint subscribed to:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `account.updated`
  - `account.external_account.updated`
  - `payout.paid`
  - `payout.failed`

### Environment

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_CONNECT_DEFAULT_COUNTRY=CA`
- `STRIPE_CONNECT_USE_ON_BEHALF_OF` unset or `0`

### Host Gate

Each launch host must pass:

- `details_submitted === true`
- `charges_enabled === true`
- `payouts_enabled === true`
- `capabilities.transfers === 'active'` when available

If not ready:

- do not allow booking checkout
- direct host to finish Stripe onboarding

## Required Validation

### Automated

From `apps/web`:

```bash
pnpm run validate:bnhub-stripe
```

Expected:

- checkout session created
- webhook confirms booking
- payment row completed
- marketplace payment row paid
- fee split sums correctly

### Manual Test Flow

1. Test host with incomplete onboarding.
2. Verify checkout is blocked.
3. Complete host onboarding.
4. Create booking as guest.
5. Complete Stripe Checkout in test mode.
6. Confirm booking status becomes confirmed.
7. Confirm guest sees `Payment confirmed`.
8. Confirm host sees `Guest paid` and `Payout scheduled`.
9. Confirm booking timeline and dashboards match.

### Failure Test

Run at least one:

- checkout expired
- payment failed
- payout failed if available

Expected:

- booking not falsely confirmed
- host not shown as paid out
- guest sees failure/pending state
- support can diagnose the case

## Launch-Day Status Language

### Guest

- `Payment confirmed`
- `Payment processing`
- `Payment action needed`
- `Payment failed`
- `Refund requested`
- `Refund under review`
- `Refund processed`

### Host

- `Guest paid`
- `Payout scheduled`
- `Payout on hold`
- `Payout paid`
- `Payout failed`
- `Dispute under review`

## Refund Policy At Soft Launch

Allowed:

- full refund
- partial refund
- host cancellation refund

Manual-first rules:

- support approves refund outcome
- support decides whether payout release should remain held
- no automatic host recovery logic after complex cases

### Refund Triage

When a guest asks for a refund:

1. Check booking status
2. Check payment status
3. Check payout hold/release state
4. Decide:
   - full refund
   - partial refund
   - no refund
5. Record reason
6. Execute or deny

## Dispute Policy At Soft Launch

When a dispute is opened:

- create dispute record
- lock payout release
- flag booking for support review
- collect host evidence
- track Stripe dispute state

Manual-first rules:

- every dispute gets manual review
- no automatic host debit after dispute loss
- host recovery decisions require business/legal review

## Support Triage

### Guest paid but booking not confirmed

- inspect Stripe event delivery
- inspect booking timeline
- inspect payment row and marketplace payment row

### Host cannot accept paid bookings

- inspect connected account readiness
- confirm onboarding completed
- confirm transfers capability is active

### Host payout failed

- inspect `payout.failed`
- inspect payout hold state
- notify host to review payout account details

### Guest refund request

- inspect booking/payment/refund state
- confirm whether payout should remain held
- apply support-approved refund outcome

### Guest dispute / chargeback

- confirm dispute record exists
- hold payout
- request host evidence
- track case until support decision

## First-Week Monitoring

Watch daily:

- checkout session creation failures
- webhook signature failures
- duplicate webhook handling
- booking confirmed without paid session
- paid session without booking update
- payout failed events
- hosts losing payout readiness
- refunds under review
- disputes opened

## Escalation Rules

Escalate internally immediately if:

- guest paid but booking not confirmed after webhook delivery
- host payout fails on a real booking
- refund amount does not match support decision
- dispute opens on a recent live booking
- account readiness drops for an active host

## Launch Exit Criteria

You can keep expanding launch only if:

- Stripe config is correct
- webhook events are live and correct
- host onboarding gate works
- real booking flow works end to end
- one failure path has been verified
- guest and host dashboards reflect the correct lifecycle states
- support team can follow refund/dispute playbooks confidently

## Reference Docs

- `apps/web/docs/payments/stripe-production-readiness.md`
- `apps/web/docs/payments/bnhub-soft-launch-runbook.md`
- `apps/web/docs/payments/bnhub-refunds-disputes-soft-launch.md`
