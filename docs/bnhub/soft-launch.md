# BNHub soft launch & early growth

## Flags

- **Web (optional):** `NEXT_PUBLIC_SOFT_LAUNCH=true` — reserved for future web UI; does not block traffic.
- **Mobile:** `EXPO_PUBLIC_SOFT_LAUNCH=true` — turns on **Send feedback**, **Become a host**, and **lightweight event** beacons (`POST /api/bnhub/events`). Guest booking and Stripe flows work the same when off.

## Supabase tables

Run `docs/bnhub/supabase-growth-tables.sql` in the Supabase SQL editor so feedback, events, and host leads persist. Until then, APIs return **503** with a safe message (no secrets).

## APIs (platform)

| Route | Purpose |
|-------|---------|
| `POST /api/bnhub/feedback` | `message`, optional `email`, `screen`, `bookingId` |
| `POST /api/bnhub/events` | `eventName` (whitelist), optional `metadata` |
| `POST /api/bnhub/host-leads` | `name`, `email`, optional `propertyType`, `location` |

## Readiness

```bash
cd apps/web && pnpm run validate:bnhub:readiness
```

## Early cohort (20–100 users)

- Monitor server logs (`[bnhub]` lines), Supabase `bnhub_*` tables, and Stripe Dashboard.
- Iterate from feedback + host leads; do not scale infra until metrics justify it.
