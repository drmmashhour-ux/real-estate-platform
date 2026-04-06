# API smoke tests

## Run

From `apps/web`:

```bash
pnpm run test:bnhub:api
```

Server should be reachable at `BNHUB_SMOKE_BASE_URL` (default `http://127.0.0.1:3001`).

## What is tested (always)

- **POST /api/search/ai** — empty query → `400`; invalid JSON → `400`; sample query → `200` + `listings` (or skip if listings unavailable).
- **POST /api/bookings/create** — empty `listingId` → `400`.
- **POST /api/reviews/create** — empty body → `400`; invalid `rating` → `400`.
- **POST /api/stripe/checkout** — empty body → not `200`; fake `bookingId` → `404` (unknown booking).

## Optional integration (env)

| Env | Effect |
|-----|--------|
| `BNHUB_SMOKE_LISTING_ID` | Creates a real booking with `BNHUB_SMOKE_GUEST_EMAIL` (default `smoke-test@example.com`), then **retries same dates** → expect conflict (`409` / unavailable). |
| `BNHUB_SMOKE_AUTH` | Bearer token for `create` if your RPC requires auth. |
| `BNHUB_SMOKE_BOOKING_ID` | Guest checkout test if you skip listing create (pending booking id). |
| `BNHUB_SMOKE_REVIEW_LISTING_ID` + `BNHUB_SMOKE_PAID_BOOKING_ID` | Review submit + duplicate `409` (same email/listing/booking). Optional `BNHUB_SMOKE_REVIEW_EMAIL`. |

## DB validation

```bash
pnpm run validate:bnhub:db
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env` (never commit).

## curl examples

See historical examples in repo; prefer `pnpm run test:bnhub:api` for consistency.
