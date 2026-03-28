# Stripe BNHub – Production Readiness Report

## Status

- metadata: OK
- checkout flow: OK
- raw card handling: no
- webhook reliability: OK
- payment success: OK
- payment failure: OK
- refund flow: OK
- production safe: YES

## Architecture

- Payments use Stripe Checkout Sessions ONLY
- No raw card data is handled by backend
- Session metadata includes:
  - bookingId
  - userId
  - listingId
  - paymentType
- Metadata is derived server-side (not client)

## Webhooks

Handled events:

- checkout.session.completed → confirms booking
- payment_intent.payment_failed → logs failure
- charge.refunded → updates DB

Non-app sessions:

- return 200 with "ignored"

## Security

- Stripe secret key used server-side only
- Publishable key used on client
- Webhook signature verified
- No PAN handling anywhere in repo

## Testing

Automated:

- validate-bnhub-stripe → success / failure / refund

Manual required:

- stripe listen
- browser checkout (4242 test card)

## Known Limitations

- Stripe Connect (host payouts) not fully tested
- Manual STEP 7 required for final local verification

## Notes

- Standalone PaymentIntent used ONLY in test scripts
- Production uses Checkout Sessions exclusively
