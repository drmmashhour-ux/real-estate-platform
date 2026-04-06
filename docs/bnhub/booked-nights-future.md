# Future: `booked_nights` normalization

## Today

- **Mandatory** booking creation path: Postgres RPC **`public.create_guest_booking`** (transaction + listing lock + overlap check against `bookings` JSON `dates`).
- **No** app-layer read-check-insert fallback on the web server.

## Next hardening step

- SQL scaffold: **`apps/mobile/docs/supabase-booked-nights-scaffold.sql`**
- Intended shape: **`(listing_id, night_date)`** unique, **`booking_id`** FK — one row per night held.
- **Strongest** protection once populated: uniqueness prevents two bookings from claiming the same night even under races (beyond what JSON overlap + RPC already provides).

## Not done in MVP pass

- Triggers or RPC updates to maintain `booked_nights` from `bookings` inserts/updates.
- Dropping or denormalizing `bookings.dates` until backfilled and verified.
