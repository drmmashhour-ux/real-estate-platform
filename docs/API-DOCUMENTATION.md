# API Documentation

Main API is served by **apps/web** (Next.js). Base path: `/api`.

## Auth

- `POST /api/auth/register` — Register (email, password, name?, role?)
- `POST /api/auth/login` — Login (email, password)
- `POST /api/auth/logout` — Clear session
- `POST /api/auth/demo-session` — Set session for demo user (email); **403 in production** (`NODE_ENV === "production"`)
- `POST /api/auth/password-reset` — Password reset stub (email)

## Users

- User profile and management via auth and app logic. Extend with `GET/PUT /api/users/me` as needed.

## BNHub

- `POST /api/bnhub/listings/create` — Create listing
- `GET /api/bnhub/listings` — Search listings (query: city, checkIn, checkOut, guests, minPrice, maxPrice, propertyType, roomType, instantBook, sort)
- `GET /api/bnhub/search` — Alias search (same params)
- `GET /api/bnhub/listings/:id` — Get listing
- `PUT /api/bnhub/listings/:id` — Update listing
- `GET/POST /api/bnhub/listings/:id/photos` — List/set photos
- `GET /api/bnhub/pricing/breakdown` — Price breakdown (listingId, checkIn, checkOut)
- `GET/POST/PUT /api/bnhub/availability` — Calendar (listingId, date/slots)
- `POST /api/bnhub/bookings` — Create booking
- `GET /api/bnhub/bookings/:id` — Get booking
- `POST /api/stripe/checkout` — Start payment (e.g. `paymentType: booking`, `bookingId`); `POST /api/stripe/webhook` confirms paid state
- `POST /api/bnhub/bookings/:id/approve` — Host approve
- `POST /api/bnhub/bookings/:id/decline` — Host decline
- `POST /api/bnhub/bookings/:id/cancel` — Cancel (body: `{ by: "guest" | "host" }`)
- `GET/POST /api/bnhub/messages` — Messages (GET ?bookingId=, POST body: bookingId, body)
- `POST /api/bnhub/reviews` — Create review
- `GET /api/bnhub/reviews/:listingId` — List reviews for listing

## Listings (unified)

- `GET /api/listings` — Search (same as BNHub listings)
- `POST /api/listings` — Create (session = owner)
- `GET /api/listings/:id` — Get one
- `PUT /api/listings/:id` — Update

## Search

- `GET /api/search` — Search (location, price, dates, guests)

## Admin

- `GET/POST /api/admin/*` — Admin-only routes (moderation, fraud, health, etc.). See apps/web/app/api/admin.

For full BNHub API reference see [BNHUB-API-REFERENCE.md](BNHUB-API-REFERENCE.md).
