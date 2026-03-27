# BNHub Module

BNHub is the short-term rental (STR) module: listings, availability, bookings, reviews, and messaging.

## Location

- **Module (domain logic):** `modules/bnhub/`
- **Implementation:** `apps/web` (API routes, lib/bnhub, Prisma schema)

## Module structure (`modules/bnhub`)

- **models** — BNHubListing, BNHubAvailability, BNHubBooking, BNHubReview (types/interfaces)
- **services** — ListingService, AvailabilityService, BookingService, ReviewService (interfaces + stubs)
- **controllers** — listings-controller (HTTP handlers)
- **routes** — Route config array + `registerBnhubRoutes(router)` for any Express-like router
- **validators** — Request validation schemas
- **tests** — Unit tests (e.g. listing-service.test.ts)

## Domain concepts

- **Listings** — STR properties (title, location, price, photos, amenities, host)
- **Availability** — Calendar slots (available/blocked) per listing
- **Bookings** — Reservations (guest, listing, check-in/out, status, payment)
- **Reviews** — Guest reviews for listings (rating, text)
- **Messages** — Booking-related chat (guest ↔ host)

## API surface

See [API-DOCUMENTATION.md](API-DOCUMENTATION.md) and [BNHUB-API-REFERENCE.md](BNHUB-API-REFERENCE.md) for full endpoints.

## Database

Tables (Prisma in web-app): `Listing`, `Availability`, `Booking`, `Review`, `Message`, `Payment`, `User`.
