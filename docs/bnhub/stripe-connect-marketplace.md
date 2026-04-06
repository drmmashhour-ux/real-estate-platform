# Stripe Connect — marketplace payouts (preparation)

## Current state (unchanged for guests)

- **Guest checkout** uses **`POST /api/stripe/checkout`** with `{ bookingId }` for BNHub Supabase guest bookings.
- Platform Stripe account receives funds; **no host split** in this MVP path.
- **Webhooks** remain the source of truth for `paid` status on `bookings`.

**Host onboarding is separate:** Connect Account Links are for **payout readiness**, not for charging the guest. Stripe secrets stay on the server; mobile only opens hosted onboarding URLs returned by the API.

## Prisma user fields (platform)

- `stripe_account_id` (nullable) — Stripe Connect Express account id.
- `stripe_onboarding_complete` — aligned with Stripe when onboarding is complete.
- `stripe_charges_enabled` / `stripe_payouts_enabled` — synced from Stripe Account objects for dashboards.

## Backend responsibilities

| Concern | Location |
|--------|-----------|
| Create Express account / persist id | `apps/web/lib/stripe/hostConnectExpress.ts` — `ensureHostExpressAccount` |
| Account Links (onboarding URL) | `createHostAccountOnboardingLink` |
| Sync readiness from Stripe | `syncHostOnboardingCompleteFromStripe` |
| Web session | `POST /api/stripe/connect/create-account`, `POST /api/stripe/connect/create-account-link` |
| Mobile Bearer | `POST /api/mobile/v1/stripe/connect/create-account`, `POST /api/mobile/v1/stripe/connect/onboarding-link`, `GET /api/mobile/v1/stripe/connect/status` |
| Gross host volume (Supabase) | `apps/web/lib/bookings/get-host-payout-estimate.ts`, `get-host-earnings-summary.ts` |

## Target architecture (future payouts)

1. **Platform fee** — application fee or `application_fee_amount` on PaymentIntent / Checkout Session.
2. **Host payout** — Stripe Connect Express; destination charges or separate charges + transfers.
3. **Listing/host linkage** — Supabase `listings.host_user_id` for bookings reporting; Prisma `User.stripeAccountId` as Connect destination when split checkout ships.

## What not to do yet

- Do **not** change existing guest checkout or webhook contracts until Connect onboarding and reconciliation are product-ready.
- Do **not** put Stripe **secret** keys in mobile.

## Next implementation steps (when prioritized)

1. Wire Checkout with `transfer_data.destination` / application fee for eligible bookings.
2. Extend webhooks for Connect account updates and payout failures.

## References

- [Stripe Connect: Marketplace](https://stripe.com/docs/connect/marketplace)
- [Separate charges and transfers](https://stripe.com/docs/connect/charges)
