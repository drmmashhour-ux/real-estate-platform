# BNHub mobile guest — bookings, Stripe, Supabase

Guest mode (no LECIPM login): mobile reads **listings/bookings/reviews/images** via Supabase anon; **creates bookings**, **submits reviews**, and **starts checkout** only through **`apps/web`**; **Stripe** and **service role** keys stay on the server.

## End-to-end flow

1. Guest browses listings → property → dates + **guest email** → **Confirm booking**.
2. **`POST /api/bookings/create`** — body: `{ listingId, selectedDates, guestEmail }` (unchanged contract). Optional **`Authorization: Bearer`** from Supabase sets **`user_id`** server-side via RPC param **`p_user_id`**; guests omit the header. **Only** the Supabase RPC **`public.create_guest_booking`** (see `apps/mobile/docs/supabase-rpc-create-guest-booking.sql`) creates rows: one transaction, listing **`SELECT … FOR UPDATE`**, overlap vs non-**canceled** bookings, pricing from **`listings.price_per_night`**, **`status = pending`**, returns **`booking_id`**, title, total, nights. **Legacy read-check-insert is removed.** If the function is missing or returns nothing: **503**, **`code: RPC_REQUIRED`**, **`error`: `Booking RPC is not deployed.`** Missing Supabase env (no service client): **503** without that code. Response on success: **`bookingId`**, **`total`**, **`nights`**, **`title`**. Clients must not send a trusted total.
3. **`POST /api/stripe/checkout`** with **`{ bookingId }` only**. Server creates Stripe Checkout, sets **`processing`** + session id. **Paid** only via **`checkout.session.completed`** webhook.
4. Webhook sets **`paid`**, emails, etc.
5. **`booking-details`** is the central **post-booking / receipt** screen (status, totals, review after paid). Mobile **never** marks paid locally.

## Booking lifecycle (`bookings.status`)

| Status | Meaning |
|--------|---------|
| `pending` | Created, no active checkout recorded |
| `processing` | Checkout session created |
| `paid` | Webhook-confirmed |
| `canceled` | Canceled — nights released for overlap in RPC |
| `completed` | Optional post-stay ops |

## API routes (web)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/bnhub/public/listings` | Guest listing grid (mobile uses this instead of direct Supabase reads) |
| GET | `/api/bnhub/public/listings/[id]` | Property detail + gallery + review preview |
| GET | `/api/bookings/guest/[bookingId]` | Guest booking snapshot (receipt / confirmation) |
| GET | `/api/bookings/guest/[bookingId]/status` | Lightweight status poll after Stripe |
| POST | `/api/bookings/create` | Guest booking (**RPC only**) |
| POST | `/api/stripe/checkout` | Guest checkout (`bookingId` only) |
| POST | `/api/reviews/create` | Guest review: `listingId`, `rating`, `comment?`, `guestEmail`, `bookingId?` |
| POST | `/api/bnhub/listing-media/upload` | Ops: Storage + `listing_images` (Bearer secret) |
| GET | `/api/host/earnings` | Host metrics + weekly bars |

## Overlap & future hardening

- **Mandatory** enforcement: **`public.create_guest_booking`** (transaction + lock + overlap in DB).
- **Future:** normalized **`booked_nights`** table — see **`docs/bnhub/booked-nights-future.md`** and **`apps/mobile/docs/supabase-booked-nights-scaffold.sql`** (scaffold only; not populated in this pass).
- **UI hints** only: **`guest-booking-availability`** helpers for calendars; not a substitute for the RPC.

## Guest reviews (write)

- **`POST /api/reviews/create`** validates listing exists, **rating 1–5**, optional **comment**, **`guestEmail`**, optional **`bookingId`** (must match listing + email + paid stay).
- Apply **`apps/mobile/docs/supabase-reviews-guest-email.sql`**. If **`reviews`** is missing, API returns **`REVIEWS_UNAVAILABLE`**.

## Listing media

- Expect **`cover_image_url`** and/or **`listing_images`**. See **`docs/bnhub/listing-media-expectations.md`** and **`docs/bnhub/listing-media-storage.md`**.

## Schema apply order

1. `apps/mobile/docs/supabase-listings.sql`
2. `apps/mobile/docs/supabase-bookings-user-id.sql` (nullable `bookings.user_id`)
3. `apps/mobile/docs/supabase-rpc-create-guest-booking.sql`
4. `apps/mobile/docs/supabase-reviews-guest-email.sql` (and optional `supabase-reviews-reviewer-user.sql` for account-linked reviews)
5. Optional: `supabase-booked-nights-scaffold.sql` (future)

## Local dev

- Web: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Mobile: **`EXPO_PUBLIC_API_BASE_URL`** only (no secrets).

## Security

- No Stripe or Supabase **service** keys in mobile (anon key only for Supabase Auth).
- Webhook verifies Stripe signature.
- **Hybrid auth**: guest browse/book/pay unchanged; signed-in users get **`user_id`** on bookings; host/admin routes require valid JWT + role checks on **`apps/web`**. RLS tightening path: **`apps/mobile/docs/supabase-rls-hybrid-auth.md`**.

## Notifications

- Booking paid email when Resend is configured.
