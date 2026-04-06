# BNHub mobile + platform architecture

## Principles

- **Platform (`apps/web`)** owns business rules: booking creation (RPC), availability inside RPC, ownership via server-verified JWT, Stripe session creation, webhooks, review validation, host/admin authorization, earnings aggregation.
- **Mobile (`apps/mobile`)** owns UI, navigation, forms, loading/error states, and **calls HTTP APIs only** for sensitive flows. It does not embed service keys or implement authoritative availability/booking/review logic.

## Guest vs authenticated

- **Guest**: browse and book without login; `POST /api/bookings/create` with `{ listingId, selectedDates, guestEmail }`; optional Bearer adds `user_id` server-side only.
- **Authenticated**: same public routes; Bearer on calls links `user_id` on bookings and `reviewer_user_id` on reviews where applicable.
- **Host / admin**: protected APIs + mobile friendly 401/403 UI; no global login wall on app open.

## Mobile → platform endpoints (BNHub guest)

| Flow | Endpoint |
|------|----------|
| Listings grid | `GET /api/bnhub/public/listings` — optional query: `q`, `minPrice`, `maxPrice`, `lat`, `lng`, `radiusKm` |
| Property detail + gallery + review summary | `GET /api/bnhub/public/listings/[listingId]` |
| Create booking | `POST /api/bookings/create` |
| Booking snapshot (receipt / confirmation) | `GET /api/bookings/guest/[bookingId]` |
| Booking status poll (payment screen) | `GET /api/bookings/guest/[bookingId]/status` |
| Stripe Checkout | `POST /api/stripe/checkout` with `{ bookingId }` |
| Review | `POST /api/reviews/create` |
| My bookings (signed-in) | `GET /api/mobile/v1/bnhub/my-bookings` |
| Session / role | `GET /api/mobile/v1/me` |

Direct `supabase.from(...)` reads for listings, bookings, and reviews were removed from the mobile app in favor of these routes.

## Secrets

- Mobile: `EXPO_PUBLIC_*` only (API base URL, Supabase URL + **anon** key for auth session). No service role, no Stripe secret keys.

## RLS

- Server uses the service role where required. Long-term RLS tightening is described in `apps/mobile/docs/supabase-rls-hybrid-auth.md`.
