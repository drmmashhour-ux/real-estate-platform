# User journey optimization (BNHub)

## Goals

Measure the path **landing → search → listing click → listing view → checkout → payment**, reduce drop-offs, and surface admin guidance.

## Events (`analytics_events`)

| Step | `name` | How it is recorded |
|------|--------|-------------------|
| Landing | `landing_visit` | `JourneyLandingBeacon` on marketing home (once / session) |
| Search | `search_used` | BNHub stays search when results load (once / session) |
| Result click | `listing_click` | Click on a result card → `/api/journey/event` |
| Listing view | `listing_view` | Server: `trackJourneyEvent` on BNHub stay detail (`metadata.journey = bnhub`) |
| Checkout | `booking_started` | Checkout page mount |
| Paid | `payment_completed` | Stripe webhook (`metadata.journey = bnhub` for booking checkouts) |

Legacy marketplace funnel (`listing_view` / `contact_click` / …) remains on **`/admin/funnel`**. BNHub journey is on **`/admin/journey`**.

## Drop-off analysis

`getBnhubJourneySnapshot` computes sequential rates and volume gaps between adjacent steps. Heuristic **improvements** flag weak transitions (e.g. search vs landing, checkout vs view).

## UI / trust (product)

- **Checkout**: `TrustStrip`, `BnhubStripeTrustHint`, itemized pricing copy (“taxes and fees shown before you pay”).
- **Listing**: existing review, host, and verification UI; BNHub trust components.
- **Recommendations**: home rails + dashboard (see recommendation engine doc).

## Follow-up

- `lib/bnhub/bnhub-retention-followups.ts` — browse nudges, digests (batch).
- Journey metrics inform copy and prioritization; cron wiring is ops-specific.

## Migration

Apply Prisma migration adding enum values: `landing_visit`, `search_used`, `listing_click`, `booking_started`.

```bash
pnpm prisma migrate deploy --schema=apps/web/prisma/schema.prisma
pnpm prisma generate --schema=apps/web/prisma/schema.prisma
```
