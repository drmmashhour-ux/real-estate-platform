# LECIPM Core MVP Platform

**First end-to-end marketplace flow: user → host → listing → guest → search → book → pay → message → review**

This document describes the **Core MVP Platform**: structure, authentication, listings, search, booking, payment, messaging, reviews, host dashboard, admin, database models, and the full flow. Implementation lives in the monorepo with the **web app** as the primary application and **BNHub** as the short-term rental engine.

---

# 1. Project Structure

The MVP uses a **modular** layout; the main app and APIs are in `apps/web` with shared libs. Services can be split out later.

```
apps/
  web-app/          # Main app: web UI, BNHub, marketplace, admin, API routes
  admin-dashboard/  # Optional standalone admin (placeholder)

services/           # Optional microservices (auth, users, listings, etc.)
  auth-service/
  user-service/
  listing-service/
  ...

packages/           # Shared code
  ui-components/
  design-tokens/
  api-client/
  shared-utils/
```

**MVP focus:** `apps/web` contains:
- Next.js app (pages, API routes)
- Prisma schema and DB access
- Auth (session, register, login)
- BNHub: listings, search, booking, payment, messaging, reviews
- Host dashboard and admin UI

---

# 2. Authentication System

## Features

- **User registration** — `POST /api/auth/register` (email, password, name, optional role)
- **Login** — `POST /api/auth/login` (email, password); sets session cookie
- **Password reset** — `POST /api/auth/password-reset` (MVP stub; returns ok, no email)
- **Session management** — Cookie `lecipm_guest_id`; `getGuestId()` in server code
- **Demo session** — `POST /api/auth/demo-session` (email) for demo users without password; **disabled when `NODE_ENV === "production"`**
- **Roles** — `USER` (guest), `OWNER_HOST` (host), `LICENSED_PROFESSIONAL` (broker), `INVESTOR`; stored on `User.role`

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account; body: email, password, name?, role? |
| POST | /api/auth/login | Log in; body: email, password |
| POST | /api/auth/password-reset | Stub; body: email |
| POST | /api/auth/demo-session | Set session for demo user; body: email; **403 in production** |
| POST | /api/auth/logout | Clear session cookie |

---

# 3. Listings System

Hosts create and manage short-term rental listings. Fields: title, description, address, city, country, nightPriceCents, beds, baths, maxGuests, photos (array of URLs), amenities (array of strings, e.g. WiFi, Kitchen), houseRules (optional string).

## APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/listings | Create listing (session = owner); or POST /api/bnhub/listings/create with ownerId |
| GET | /api/listings | Search (query: city, checkIn, checkOut, minPrice, maxPrice, guests, sort) |
| GET | /api/listings/:id | Get one listing |
| PUT | /api/listings/:id | Update listing (partial) |

Same flows under `/api/bnhub/listings` and `/api/bnhub/listings/[id]`.

---

# 4. Search System

Guests search listings by location, price range, dates (availability), and guests.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/search | Query: location (city), priceMin, priceMax, checkIn, checkOut, guests, sort |

Or use `GET /api/listings` with the same query params. Availability is filtered when checkIn/checkOut are provided.

---

# 5. Booking Engine

Bookings link guest, listing, and dates. Statuses: `PENDING` (awaiting payment), `CONFIRMED`, `CANCELLED`, `COMPLETED`.

## Fields

- listingId, guestId, checkIn, checkOut, nights, totalCents, guestFeeCents, hostFeeCents, status, guestNotes

## APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bnhub/bookings | Create booking (session = guest); body: listingId, checkIn, checkOut, guestNotes? |
| GET | /api/bnhub/bookings/:id | Get booking (guest or host) |
| POST | /api/stripe/checkout + /api/stripe/webhook | Guest pays via Stripe; booking/payment confirmed only via webhook |

---

# 6. Payment Integration

Flow: **booking created** → Payment record created (PENDING) → **payment confirmed** via POST pay → booking CONFIRMED, payment COMPLETED → **payout** (host payout amount stored; actual payout can be batch or external).

Stored: payment status, amountCents, guestFeeCents, hostFeeCents, hostPayoutCents, stripePaymentId (optional). MVP uses mock confirm; integrate Stripe (or other) when ready.

---

# 7. Messaging System

**Booking-scoped chat:** guest and host message within a booking.

## Features

- Send message in a booking thread
- List message history for a booking
- Sender and timestamp stored

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bnhub/messages?bookingId= | List messages (guest or host only) |
| POST | /api/bnhub/messages | Send message; body: bookingId, body |

---

# 8. Review System

Guests leave a review (property rating, optional host rating, comment) after stay. One review per booking.

## Fields

- propertyRating (1–5), hostRating (1–5 optional), comment, guestId, listingId, bookingId

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bnhub/reviews | Create review; body: bookingId, propertyRating, hostRating?, comment? |
| GET | /api/bnhub/listings/:id | Listing includes recent reviews |

---

# 9. Host Dashboard

**Path:** `/bnhub/host/dashboard` (or `?ownerId=` for demo).

- **Listing management** — List host’s listings; link to create/edit (BNHub flows)
- **Booking management** — Upcoming and past bookings for host’s listings
- **Revenue summary** — Earnings from completed payments (hostPayoutCents)

Implemented in `apps/web/app/bnhub/host/dashboard/`.

---

# 10. Admin Dashboard

**Path:** `/admin` and `/admin/*`.

- **Listing approvals** — Moderation queue: approve/reject listings (verification status)
- **Dispute monitoring** — Disputes list and resolution
- **Fraud flags** — Fraud alerts and signals
- **User management** — User list and basic admin (e.g. demo users)

Implemented in `apps/web/app/admin/` and `/api/admin/`. Defense, health, and other admin tools are under `/admin/defense`, `/admin/health`, etc.

---

# 11. Database Models (MVP)

| Model | Purpose |
|-------|---------|
| **User** | id, email, passwordHash?, role, name; relations to listings, bookings, reviews, messages |
| **ShortTermListing** | title, description, address, city, country, nightPriceCents, beds, baths, maxGuests, photos, amenities[], houseRules?, verificationStatus, ownerId |
| **Booking** | listingId, guestId, checkIn, checkOut, nights, totalCents, guestFeeCents, hostFeeCents, status |
| **Payment** | bookingId, amountCents, guestFeeCents, hostFeeCents, hostPayoutCents, status, stripePaymentId? |
| **BookingMessage** | bookingId, senderId, body, createdAt |
| **Review** | bookingId, guestId, listingId, propertyRating, hostRating?, comment? |

Relations: User → ShortTermListing, Booking (guest), Review, BookingMessage. Booking → Payment, Review, BookingMessage. ShortTermListing → Booking, Review.

Availability: `AvailabilitySlot` (listingId, date, available). Verification: `ListingVerificationLog`. Disputes: `Dispute`, `DisputeMessage`, `DisputeEvidence`.

---

# 12. MVP End-to-End Flow

1. **User signup** — POST /api/auth/register → account + session.
2. **Host creates listing** — POST /api/listings (or /api/bnhub/listings/create) → listing created; submit for verification if required.
3. **Guest searches** — GET /api/search or GET /api/listings with location, dates, price.
4. **Guest books** — POST /api/bnhub/bookings (listingId, checkIn, checkOut) → booking PENDING, payment PENDING.
5. **Guest pays** — POST /api/bnhub/bookings/:id/pay → booking CONFIRMED, payment COMPLETED.
6. **Host receives booking** — Visible in host dashboard; GET /api/bnhub/bookings/:id.
7. **Guest and host message** — POST /api/bnhub/messages (bookingId, body); GET /api/bnhub/messages?bookingId=.
8. **Guest leaves review** — POST /api/bnhub/reviews (bookingId, propertyRating, comment) after stay.

**Payout:** hostPayoutCents is stored on Payment; actual payout to host is a separate step (batch or Stripe Connect) when implemented.

---

# Quick Reference: MVP APIs

| Area | Endpoints |
|------|-----------|
| Auth | POST /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/demo-session, /api/auth/password-reset |
| Listings | GET/POST /api/listings, GET/PUT /api/listings/:id |
| Search | GET /api/search |
| Bookings | POST /api/bnhub/bookings, GET /api/bnhub/bookings/:id; pay via POST /api/stripe/checkout + webhook |
| Messages | GET/POST /api/bnhub/messages |
| Reviews | POST /api/bnhub/reviews |
| Host | /bnhub/host/dashboard |
| Admin | /admin, /admin/moderation, /admin/defense, etc. |

---

*The Core MVP is implemented in `apps/web`. Run `npm run dev` from repo root or `apps/web`, then use the BNHub and auth flows above. For full architecture see [Master Strategy Book](MASTER-STRATEGY-BOOK.md) and [Build Order](engineering/LECIPM-BUILD-ORDER.md).*
