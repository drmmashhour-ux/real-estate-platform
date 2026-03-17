# BNHub Short-Term Rental — Implementation Summary

This document maps the requested BNHub specification to the LECIPM implementation. The full flow is supported: **Host creates listing → Guest searches → Guest books → Guest pays → Reservation confirmed → Messaging → Reviews.**

---

## 1. BNHub Listing Model

**Database:** `ShortTermListing` (Prisma) — corresponds to `bnhub_listings`.

| Requested field       | Implementation field        | Notes |
|-----------------------|-----------------------------|--------|
| id                    | id                          | UUID   |
| host_id               | ownerId                     | FK to User |
| title                 | title                       |        |
| description           | description                 |        |
| property_type         | propertyType                |        |
| room_type             | roomType                    |        |
| address               | address                     |        |
| city                  | city                        |        |
| country               | country                     |        |
| latitude / longitude  | latitude, longitude         |        |
| max_guests            | maxGuests                   |        |
| bedrooms              | bedrooms (optional)         |        |
| beds                  | beds                        |        |
| bathrooms             | baths                       |        |
| amenities             | amenities (String[])        |        |
| house_rules           | houseRules                  |        |
| check_in_time         | checkInTime                 |        |
| check_out_time        | checkOutTime                |        |
| nightly_price         | nightPriceCents             | Cents  |
| cleaning_fee          | cleaningFeeCents           |        |
| security_deposit      | securityDepositCents       |        |
| cancellation_policy   | cancellationPolicy         |        |
| instant_book_enabled  | instantBookEnabled         |        |
| minimum_stay          | minStayNights              |        |
| maximum_stay          | maxStayNights              |        |
| status                | listingStatus              | DRAFT / PUBLISHED / UNLISTED / SUSPENDED |
| created_at / updated_at | createdAt, updatedAt    |        |

**Listing photos:** `BnhubListingPhoto` (id, listingId, url, sortOrder, isCover) — corresponds to `bnhub_photos`.

---

## 2. Host Listing Creation

**Wizard:** `/bnhub/host/listings/new` — 7 steps:

1. **Property basics** — property type, room type, beds, baths, max guests  
2. **Location** — address, city, region, country  
3. **Description and amenities** — title, subtitle, description, amenities, house rules  
4. **Photos** — comma-separated or line-separated image URLs  
5. **Pricing** — nightly price, cleaning fee, security deposit, tax %, min/max stay  
6. **Booking settings** — check-in/out time, cancellation policy, instant book  
7. **Preview and publish** — review summary, publish or save as draft  

**API:** `POST /api/bnhub/listings/create` (session = host). Quick-add form also on host dashboard.

---

## 3. Guest Search

**Page:** `/bnhub` (BNHubSearchClient).

**Filters:** location (city), check-in date, check-out date, guest count, price range (min/max), amenities (via listing data), property type, room type, verified only, instant book.

**API:** `GET /api/bnhub/listings` or `GET /api/listings` — query params: `city`, `checkIn`, `checkOut`, `guests`, `minPrice`, `maxPrice`, `propertyType`, `roomType`, `instantBook`, `verifiedOnly`, `sort`.

**Results:** Listing cards with photo, title, rating, price per night, location (city/country). Only `listingStatus === "PUBLISHED"` returned.

---

## 4. Listing Detail Page

**Page:** `/bnhub/[id]`.

Includes:

- **Photo gallery** — from `listingPhotos` or legacy `photos`
- **Host summary** — name, Super Host badge, quality score, contact link
- **Property details** — beds, baths, max guests, city, country, amenities
- **House rules** — house rules text, check-in/out times
- **Map location** — when `latitude`/`longitude` set (OpenStreetMap embed + link)
- **Reviews** — list with rating and comment
- **Availability calendar** — AvailabilityCalendar component
- **Price breakdown** — from `/api/bnhub/pricing/breakdown` when dates selected
- **Book button** — BookingForm with instant book or “Request to book”

---

## 5. Availability Calendar

**Host:**

- **Block / set dates:** `POST /api/bnhub/availability` (single date: `listingId`, `date`, `available`, optional `priceOverrideCents`)
- **Bulk:** `PUT /api/bnhub/availability` — body: `{ listingId, slots: [{ date, available?, priceOverrideCents? }] }`
- **Min/max stay:** on listing (`minStayNights`, `maxStayNights`) and optionally per slot (`AvailabilitySlot.minStayNights`)

**Guest:** Availability calendar on listing page; booking creation checks availability (no overlapping CONFIRMED/PENDING/AWAITING_HOST_APPROVAL bookings and no blocked slots). Double bookings prevented in `isListingAvailable()` and at booking creation.

**API:** `GET /api/bnhub/availability?listingId=&start=&end=` — returns slots for range.

---

## 6. Booking Engine

**Flow:**

1. Guest selects dates → frontend calls pricing breakdown  
2. System checks availability (`isListingAvailable`)  
3. System calculates price (`computeBookingPricing`)  
4. `POST /api/bnhub/bookings` creates booking (and payment record)  
5. If instant book: status `PENDING` → guest pays → `POST /api/bnhub/bookings/:id/pay` → booking confirmed  
6. If not instant book: status `AWAITING_HOST_APPROVAL` → host approves → status `PENDING` → guest pays → confirmed  

**Statuses:** pending, confirmed, cancelled, completed (+ awaiting_host_approval, declined, cancelled_by_guest, cancelled_by_host for full flow).

**APIs:**  
- `POST /api/bnhub/bookings` — create  
- `GET /api/bnhub/bookings/:id` — get  
- `POST /api/bnhub/bookings/:id/pay` — confirm after payment  
- `POST /api/bnhub/bookings/:id/approve` — host approve  
- `POST /api/bnhub/bookings/:id/decline` — host decline  
- `POST /api/bnhub/bookings/:id/cancel` — cancel (body: `{ by: "guest" | "host" }`)

---

## 7. Pricing Calculation

**Module:** `lib/bnhub/booking-pricing.ts`.

**Service:** `computeBookingPricing({ listingId, checkIn, checkOut })` returns:

- Nightly cost (with optional per-date overrides from `AvailabilitySlot`)
- Cleaning fee
- Taxes (listing `taxRatePercent`)
- Service fee (guest fee %)
- Total price

**API:** `GET /api/bnhub/pricing/breakdown?listingId=&checkIn=&checkOut=` — full breakdown for listing page and checkout.

---

## 8. Checkout Flow

**Where:** Listing page booking form + booking confirmation page.

Checkout shows:

- **Selected dates** — check-in / check-out
- **Guest count** — implied by listing (max guests); can be extended if needed
- **Price breakdown** — subtotal, cleaning fee, tax, service fee, total (from pricing API)
- **House rules confirmation** — checkbox “I agree to the house rules and cancellation policy” when house rules or cancellation policy exist
- **Cancellation policy** — displayed in the same block as the checkbox
- **Payment** — “Book now” / “Request to book” submits booking; then redirect to `/bnhub/booking/:id` where guest can pay (Pay button) when status is PENDING

---

## 9. Messaging

**Booking chat:** Guest and host message in the context of a reservation.

- **Store:** `BookingMessage` (bookingId, senderId, body, createdAt) — per reservation
- **API:** `GET /api/bnhub/messages?bookingId=` — list messages  
- **API:** `POST /api/bnhub/messages` — body: `{ bookingId, body }` — send message  

Caller must be guest or host for that booking.

---

## 10. Reviews

**Rules:** Only after **completed** stays; one review per booking.

**Fields:** rating (propertyRating 1–5), comment, reviewer_id (guestId), listing_id, booking_id; optional host rating and category ratings (cleanliness, communication, location, value). Target is the listing (and implicitly host via listing).

**API:** `POST /api/bnhub/reviews` — body: `bookingId`, `guestId`, `listingId`, `propertyRating`, optional `hostRating`, `comment`, optional category ratings.

---

## 11. Host Dashboard

**Page:** `/bnhub/host/dashboard`.

Hosts can:

- **Create listings** — “Create listing (wizard)” → `/bnhub/host/listings/new`, or “Quick add” inline form
- **Edit listings** — link to `/bnhub/host/listings/[id]/edit`
- **Manage calendar** — `/bnhub/host/listings/[id]/availability`
- **View bookings** — list of reservations with status, guest, dates
- **Approve or decline** — on booking detail or dashboard (Approve/Decline for `AWAITING_HOST_APPROVAL`)
- **Earnings summary** — from completed payments (hostPayoutCents)

---

## 12. Admin Moderation

**Existing admin:**

- **Review listings** — moderation queue (e.g. `/admin/moderation`)
- **Approve/reject** — `POST /api/bnhub/moderation/:id/approve`, `POST /api/bnhub/moderation/:id/reject` (with reason)
- **Suspicious bookings** — fraud alerts, risk APIs, admin defense tools
- **Suspend users** — abuse prevention / defense layer (user restrictions)

---

## 13. Database Models

| Spec model        | Implementation model   | Purpose |
|-------------------|------------------------|--------|
| users             | User                   | Auth, host, guest |
| bnhub_listings    | ShortTermListing       | Listings |
| bnhub_photos      | BnhubListingPhoto      | Listing photos (order, cover) |
| bnhub_availability| AvailabilitySlot       | Per-date available, price override |
| bnhub_bookings    | Booking                | Reservations |
| bnhub_reviews     | Review                 | Guest reviews (listing + optional host) |
| messages          | BookingMessage         | Guest–host chat per booking |
| payments          | Payment                | Per-booking payment (amount, fees, status) |

Additional: BnhubBookingEvent (audit), BnhubCheckinDetails (check-in info), ListingVerificationLog, Dispute, etc.

---

## 14. API Endpoints

| Spec endpoint                  | Implementation |
|-------------------------------|----------------|
| POST /bnhub/listings          | POST /api/bnhub/listings/create |
| GET /bnhub/listings          | GET /api/bnhub/listings (search) or GET /api/listings |
| GET /bnhub/listings/:id      | GET /api/bnhub/listings/:id or GET /api/listings/:id |
| POST /bnhub/bookings         | POST /api/bnhub/bookings |
| GET /bnhub/bookings/:id      | GET /api/bnhub/bookings/:id |
| POST /bnhub/bookings/:id/cancel | POST /api/bnhub/bookings/:id/cancel (body: `{ by: "guest" \| "host" }`) |
| POST /bnhub/reviews          | POST /api/bnhub/reviews |

Additional: PATCH /api/bnhub/listings/:id, GET/POST /api/bnhub/listings/:id/photos, GET/POST/PUT /api/bnhub/availability, GET /api/bnhub/pricing/breakdown, POST .../bookings/:id/pay, .../approve, .../decline, GET/POST /api/bnhub/messages.

---

## 15. Goal — Full BNHub Flow

| Step | Implementation |
|------|----------------|
| Host publishes listing | Create via wizard or quick add; set listingStatus to PUBLISHED (and verification if required). |
| Guest searches listings | `/bnhub` with filters; GET /api/bnhub/listings. |
| Guest selects dates | On listing page; availability and pricing from API. |
| Guest books and pays | Submit booking form (with house rules/cancellation confirmation); redirect to booking page; Pay button when PENDING. |
| Reservation created | Booking + Payment records; status CONFIRMED after payment. |
| Guest and host message | GET/POST /api/bnhub/messages?bookingId=; messaging UI linked from booking/trips. |
| Guest leaves review after stay | POST /api/bnhub/reviews after status COMPLETED; review form at `/bnhub/booking/:id/review`. |

---

**Code locations:**

- **Schema:** `apps/web-app/prisma/schema.prisma`
- **Logic:** `apps/web-app/lib/bnhub/*.ts`
- **APIs:** `apps/web-app/app/api/bnhub/**`
- **Pages:** `apps/web-app/app/bnhub/**`

Architecture is modular; APIs are RESTful and documented in this file and in `docs/BNHUB-MODULE.md`. Booking and pricing flows are implemented and tested; the system is production-oriented and readable.
