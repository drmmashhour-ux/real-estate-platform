# BNHub guest conversion layer (V1)

Read-only, advisory instrumentation for the BNHub guest funnel: **search → listing → booking start → paid completion**. It does **not** change booking creation, Stripe checkout, webhooks, pricing, payments, or ranking.

## Feature flags

| Variable | Purpose |
|----------|---------|
| `FEATURE_BNHUB_CONVERSION_V1` | Server: host dashboard summary (`buildListingConversionSummary`), listing-page boost UI, listing beacon |
| `NEXT_PUBLIC_FEATURE_BNHUB_CONVERSION_V1` | Browser: client tracker (localStorage + optional `POST /api/bnhub/conversion-signal`) |
| `FEATURE_BNHUB_CONVERSION_ADMIN_V1` | Admin: `/api/admin/bnhub/conversion-overview` + panel on **Admin → BNHUB → Booking growth** |

## Funnel metrics (host panel)

Derived from existing read-only aggregates (`buildSearchConversionMetrics` + `buildListingConversionMetrics`):

- **Impressions** — search-context denominator when telemetry allows (see `search-conversion.service.ts` notes).
- **Clicks** — discovery-style clicks attributed to the listing.
- **Views** — BNHub listing page views (`bnhubClientListingViewEvent`).
- **Booking starts / completions** — funnel stages (`bnhubClientBookingFunnelEvent`).
- **CTR** — clicks / max(impressions, 1) in the merged metrics helper (zeros safe).
- **View rate** — views / max(clicks, 1).
- **Booking rate** — completions / max(views, 1).

## Insight logic (deterministic)

Implemented in `bnhub-guest-conversion-analyzer.service.ts` and `bnhub-friction-detector.service.ts` using fixed thresholds (e.g. low CTR, low view rate, low booking rate, friction when many starts but no completions). Outputs are **hints**, not guarantees.

## What is tracked (client)

When `NEXT_PUBLIC_FEATURE_BNHUB_CONVERSION_V1` is on:

- **search_view** — increments local counters only (`search_view` is not accepted by `/api/bnhub/conversion-signal`).
- **listing_click**, **listing_view**, **booking_started**, **booking_completed** — local counters + optional persisted signal (allowed event types only).

## What is not changed

- `/api/bookings/create`, `/api/stripe/checkout`, Stripe webhooks, and payout logic are untouched.
- No automatic listing edits, price changes, or ranking overrides.

## Related docs

- [Guest conversion layer (legacy naming)](./guest-conversion-layer.md) — overlapping `FEATURE_BNHUB_GUEST_CONVERSION_*` flags and `GuestConversionPanel`.
