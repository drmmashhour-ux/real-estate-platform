# BNHub Soft Launch Runbook

## Goal

Safely soft launch BNHub booking payments for a Canada-first host set using Stripe Checkout, destination charges, and webhook-based booking confirmation.

## Launch Scope

- Country scope: Canada-first
- Host type: Stripe Express connected accounts
- Charge type: destination charges
- `on_behalf_of`: disabled by default for the soft launch
- Booking confirmation: webhook-driven only

## Pre-Launch Configuration

### Stripe Dashboard

- Connect enabled on the live Stripe platform account
- Production webhook endpoint created
- Production webhook endpoint subscribed to:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `account.updated`
  - `account.external_account.updated`
  - `payout.paid`
  - `payout.failed`

### Environment Variables

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_CONNECT_DEFAULT_COUNTRY=CA`
- `STRIPE_CONNECT_USE_ON_BEHALF_OF=0` or unset for Canada-only launch

## Host Launch Gate

Do not allow a listing to accept paid bookings until the host connected account passes:

- `details_submitted === true`
- `charges_enabled === true`
- `payouts_enabled === true`
- `capabilities.transfers === 'active'` when available

If not ready:

- block checkout
- show host onboarding-required copy
- instruct host to finish Stripe onboarding

## Test Pass Before Launch

### Code-Side Validation

From `apps/web`, run:

```bash
pnpm run validate:bnhub-stripe
```

Requirements:

- test Stripe secret key
- test webhook secret
- local Next server running
- local DB connected

Expected outcome:

- Checkout Session is created
- webhook confirms the booking
- payment row becomes completed
- marketplace payment row becomes paid
- invoice and booking side effects are created

### Manual Stripe Test Mode

1. Create or use a host with incomplete onboarding.
2. Verify guest checkout is blocked for that host listing.
3. Complete host onboarding.
4. Create a guest booking.
5. Complete Stripe Checkout using Stripe test mode.
6. Confirm webhook updates the booking to confirmed.
7. Confirm guest sees `Payment confirmed`.
8. Confirm host sees `Guest paid` and `Payout scheduled`.
9. Confirm booking page timeline and dashboard statuses match.

## Failure Path Test

Run at least one failure scenario before soft launch:

- checkout expired
- payment failure
- payout failure if available in test flow

Expected outcome:

- booking is not incorrectly confirmed
- host is not shown as paid out
- guest sees failure or pending language
- logs/admin views make the failure diagnosable

## Production Monitoring

Watch during the first week:

- Checkout session creation failures
- webhook signature failures
- duplicate webhook processing
- booking confirmed without paid session
- paid session without booking update
- payout failed events
- account readiness dropping after onboarding

## Support Playbook

### Guest paid but booking not confirmed

- inspect Stripe event delivery
- inspect booking page timeline
- inspect booking payment row and marketplace payment row

### Host cannot accept paid bookings

- inspect connected account readiness
- confirm onboarding completed
- confirm transfers capability is active

### Host payout failed

- inspect `payout.failed` event
- inspect payout hold state in app
- notify host to review payout account details

## Launch Recommendation

For the soft launch:

- use a small group of trusted Canadian hosts
- keep `on_behalf_of` off
- monitor every real paid booking manually for the first days
- expand only after one successful live booking and one verified support/failure playbook check

## Exit Criteria

Soft launch is ready when:

- Stripe live config is correct
- required webhook events are subscribed
- host onboarding gate works
- test booking succeeds end to end
- one failure path behaves correctly
- guest and host dashboards show correct lifecycle states
- support playbook is available internally
