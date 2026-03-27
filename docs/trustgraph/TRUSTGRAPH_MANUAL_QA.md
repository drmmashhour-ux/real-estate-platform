# TrustGraph — manual QA checklist

Run from **`apps/web`** with a local or staging DB.

## Environment

1. Set `TRUSTGRAPH_ENABLED=true`.
2. Sub-flags (`TRUSTGRAPH_ADMIN_QUEUE_ENABLED`, `TRUSTGRAPH_LISTING_BADGE_ENABLED`, `TRUSTGRAPH_DECLARATION_WIDGET_ENABLED`, `TRUSTGRAPH_BROKER_BADGE_ENABLED`) **default to ON** when unset; set any to `false` only to test that surface disabled.

## Core engine (no UI)

1. Save an FSBO listing in Seller Hub — confirm no errors with flags off (baseline).
2. With `TRUSTGRAPH_ENABLED=true`, save again — `VerificationCase` row appears (DB or `GET /api/trustgraph/listings/{listingId}/status` as listing owner).
3. `POST /api/trustgraph/cases/{id}/run` as owner — pipeline completes; rule results and signals populate.

## Admin queue

1. With master on (and admin queue not forced off), open `/admin/trustgraph` — table or empty state, no 500.
2. Set `TRUSTGRAPH_ADMIN_QUEUE_ENABLED=false` — sidebar hides TrustGraph; `/admin/trustgraph` shows disabled message; `GET /api/trustgraph/queue` returns 503.

## Seller UI

1. With `TRUSTGRAPH_LISTING_BADGE_ENABLED=true` — Seller Hub wizard shows trust panel when listing id exists.
2. With `TRUSTGRAPH_DECLARATION_WIDGET_ENABLED=true` — declaration step shows readiness widget (% / missing sections).

## Broker onboarding

1. With `TRUSTGRAPH_BROKER_BADGE_ENABLED=true` — broker onboarding shows verification chip where implemented.

## Flows

1. **Submit for verification** — after submit, case updates; HTTP behavior unchanged on failure of background sync.
2. **Publish checkout** — after validation, TrustGraph sync runs in background; publish still succeeds if sync fails.

## Regression

1. Seller Hub save with `TRUSTGRAPH_ENABLED` unset — unchanged.
2. Non–TrustGraph admin pages — unchanged except optional TrustGraph nav when admin queue flag allows.

## Commands

```bash
cd apps/web
npx prisma generate
npx prisma migrate deploy   # or migrate dev

TRUSTGRAPH_ENABLED=true npm run seed:trustgraph
npm run test -- --run lib/trustgraph
TRUSTGRAPH_ENABLED=true npm run dev
```
