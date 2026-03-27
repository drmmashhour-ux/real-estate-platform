# BNHub Production Database Schema Design

This document describes the production relational database schema for the BNHub short-term rental module of the LECIPM platform. The schema is designed to support **millions of listings, bookings, and users** with normalized tables, foreign keys, and scalable indexing.

**Prisma schema:** [BNHUB-production-schema.prisma](BNHUB-production-schema.prisma)

---

## Design Principles

- **Normalized tables** — No redundant data; reference entities by ID.
- **Foreign keys** — Enforce referential integrity (users → listings → bookings → payments, etc.).
- **Indexes** — On all foreign keys and common filter/sort columns (city, country, dates, status).
- **Clear relationships** — Host creates listings; guest books; payment ties to booking; messages and reviews scoped to booking/listing.

---

## 1. Users Table

Stores all platform users (guests, hosts, brokers, admins).

| Column         | Type      | Constraints | Description                    |
|----------------|-----------|-------------|--------------------------------|
| id             | UUID      | PK          | Primary key                    |
| name           | VARCHAR   |             | Display name                   |
| email          | VARCHAR   | UNIQUE      | Login identifier               |
| password_hash  | VARCHAR   |             | Hashed password (nullable for SSO) |
| role           | ENUM      |             | guest \| host \| broker \| admin |
| phone          | VARCHAR   |             | Optional                       |
| profile_photo  | VARCHAR   |             | URL or path                   |
| verified_status| ENUM     |             | unverified \| pending \| verified \| rejected |
| created_at     | TIMESTAMP |             |                                |
| updated_at     | TIMESTAMP |             |                                |

**Indexes:** `email`, `role`, `verified_status`

---

## 2. Listings Table (`bnhub_listings`)

One row per short-term rental listing. Host is the owner.

| Column                | Type      | Constraints | Description                    |
|-----------------------|-----------|-------------|--------------------------------|
| id                    | UUID      | PK          |                                |
| host_id               | UUID      | FK → users  | Listing owner                  |
| title                 | VARCHAR   |             |                                |
| description           | TEXT      |             |                                |
| property_type         | VARCHAR   |             | House, Apartment, Villa, etc.  |
| room_type             | VARCHAR   |             | Entire place, Private room     |
| address               | VARCHAR   |             |                                |
| city                  | VARCHAR   |             |                                |
| country               | VARCHAR   |             |                                |
| latitude              | FLOAT     |             | For map search                 |
| longitude             | FLOAT     |             |                                |
| max_guests            | INT       |             |                                |
| bedrooms              | INT       |             |                                |
| beds                  | INT       |             |                                |
| bathrooms             | FLOAT     |             |                                |
| nightly_price         | INT       |             | Smallest currency unit (e.g. cents) |
| cleaning_fee          | INT       |             |                                |
| security_deposit      | INT       |             |                                |
| minimum_stay         | INT       |             | Nights                         |
| maximum_stay         | INT       |             |                                |
| instant_book_enabled | BOOLEAN   |             |                                |
| cancellation_policy   | VARCHAR   |             |                                |
| status                | ENUM      |             | draft \| published \| unlisted \| suspended |
| created_at            | TIMESTAMP |             |                                |
| updated_at            | TIMESTAMP |             |                                |

**Indexes:** `host_id`, `city`, `country`, `status`, `(city, status)`, `(latitude, longitude)`

---

## 3. Listing Photos (`bnhub_listing_photos`)

Multiple photos per listing; one can be cover.

| Column      | Type      | Constraints   | Description     |
|-------------|-----------|---------------|-----------------|
| id          | UUID      | PK            |                 |
| listing_id  | UUID      | FK → bnhub_listings |         |
| photo_url   | VARCHAR   |               |                 |
| is_cover    | BOOLEAN   |               |                 |
| sort_order  | INT       |               | Display order   |
| created_at  | TIMESTAMP |               |                 |

**Indexes:** `listing_id`

---

## 4. Amenities

Reference table + junction for many-to-many listing ↔ amenities.

**amenities**

| Column | Type   | Constraints | Description |
|--------|--------|-------------|-------------|
| id     | UUID   | PK          |             |
| name   | VARCHAR| UNIQUE      | WiFi, Kitchen, etc. |

**bnhub_listing_amenities**

| Column     | Type | Constraints              | Description |
|------------|------|--------------------------|-------------|
| listing_id | UUID | FK → bnhub_listings, PK  |             |
| amenity_id | UUID | FK → amenities, PK       |             |

**Indexes:** `listing_id`, `amenity_id`

---

## 5. Availability Calendar (`bnhub_availability`)

Per-listing, per-date availability and optional price/min-stay overrides.

| Column                 | Type      | Constraints           | Description        |
|-------------------------|-----------|------------------------|--------------------|
| id                      | UUID      | PK                     |                    |
| listing_id              | UUID      | FK → bnhub_listings    |                    |
| date                    | DATE      | UNIQUE(listing_id, date) |                   |
| is_available            | BOOLEAN   |                       |                    |
| price_override          | INT       |                       | Optional nightly override (cents) |
| minimum_stay_override  | INT       |                       |                    |

**Indexes:** `listing_id`, `date`, `(listing_id, date)`

---

## 6. Bookings (`bnhub_bookings`)

One row per reservation.

| Column      | Type      | Constraints   | Description     |
|-------------|-----------|---------------|-----------------|
| id          | UUID      | PK            |                 |
| listing_id  | UUID      | FK → bnhub_listings |     |
| guest_id    | UUID      | FK → users    |                 |
| check_in    | DATE      |               |                 |
| check_out   | DATE      |               |                 |
| guests      | INT       |               |                 |
| subtotal    | INT       |               | Cents           |
| fees        | INT       |               | Cents           |
| total_price | INT       |               | Cents           |
| status      | ENUM      |               | pending \| confirmed \| cancelled \| completed |
| created_at  | TIMESTAMP |               |                 |
| updated_at  | TIMESTAMP |               |                 |

**Indexes:** `listing_id`, `guest_id`, `check_in`, `check_out`, `status`, `(listing_id, check_in, check_out)` (for double-booking checks)

---

## 7. Payments (`payments`)

One or more payment rows per booking (e.g. charge + refund).

| Column           | Type      | Constraints   | Description     |
|------------------|-----------|---------------|-----------------|
| id               | UUID      | PK            |                 |
| booking_id       | UUID      | FK → bnhub_bookings |   |
| payment_provider | VARCHAR   |               | stripe, etc.    |
| transaction_id  | VARCHAR   |               | Provider reference |
| amount           | INT       |               | Cents           |
| status           | ENUM      |               | pending \| completed \| failed \| refunded |
| created_at       | TIMESTAMP |               |                 |

**Indexes:** `booking_id`, `transaction_id`, `status`

---

## 8. Reviews (`bnhub_reviews`)

One review per booking (guest reviews listing after stay).

| Column      | Type   | Constraints   | Description |
|-------------|--------|---------------|-------------|
| id          | UUID   | PK            |             |
| booking_id  | UUID   | FK → bnhub_bookings, UNIQUE | One review per booking |
| listing_id  | UUID   | FK → bnhub_listings |         |
| reviewer_id | UUID   | FK → users    |             |
| rating      | INT    |               | 1–5         |
| comment     | TEXT   |               |             |
| created_at  | TIMESTAMP |             |             |

**Indexes:** `listing_id`, `reviewer_id`, `created_at`

---

## 9. Messaging (`bnhub_messages`)

Guest–host messages scoped to a booking.

| Column     | Type      | Constraints   | Description |
|------------|-----------|---------------|-------------|
| id         | UUID      | PK            |             |
| booking_id | UUID      | FK → bnhub_bookings |     |
| sender_id  | UUID      | FK → users    |             |
| message    | TEXT      |               |             |
| created_at | TIMESTAMP |               |             |

**Indexes:** `booking_id`, `sender_id`, `created_at`

---

## 10. Moderation (`listing_moderation`)

Admin moderation history per listing.

| Column      | Type      | Constraints   | Description |
|-------------|-----------|---------------|-------------|
| id          | UUID      | PK            |             |
| listing_id  | UUID      | FK → bnhub_listings |     |
| status      | ENUM      |               | pending \| approved \| rejected \| changes_requested |
| reason      | TEXT      |               |             |
| reviewed_by | UUID      | FK → users    | Admin who reviewed |
| created_at  | TIMESTAMP |               |             |

**Indexes:** `listing_id`, `status`, `created_at`

---

## 11. AI Data Tables

**ai_pricing_recommendations**

| Column             | Type      | Constraints   | Description |
|--------------------|-----------|---------------|-------------|
| id                 | UUID      | PK            |             |
| listing_id         | UUID      | FK → bnhub_listings |     |
| recommended_price  | INT       |               | Cents       |
| price_range_min    | INT       |               | Optional    |
| price_range_max    | INT       |               | Optional    |
| confidence         | FLOAT     |               | 0–1         |
| factors            | JSONB     |               | Optional    |
| created_at         | TIMESTAMP |               |             |

**Indexes:** `listing_id`, `created_at`

**ai_fraud_scores**

| Column     | Type      | Constraints   | Description |
|------------|-----------|---------------|-------------|
| id         | UUID      | PK            |             |
| booking_id | UUID      | FK → bnhub_bookings |     |
| risk_score | FLOAT     |               | 0–1         |
| reason     | TEXT      |               |             |
| factors    | JSONB     |               | Optional    |
| created_at | TIMESTAMP |               |             |

**Indexes:** `booking_id`, `risk_score`, `created_at`

---

## Index Summary

| Table / use case           | Indexes |
|----------------------------|---------|
| users                      | email (unique), role, verified_status |
| bnhub_listings             | host_id, city, country, status, (city, status), (latitude, longitude) |
| bnhub_listing_photos       | listing_id |
| bnhub_listing_amenities    | listing_id, amenity_id |
| bnhub_availability         | listing_id, date, (listing_id, date) unique |
| bnhub_bookings             | listing_id, guest_id, check_in, check_out, status, (listing_id, check_in, check_out) |
| payments                   | booking_id, transaction_id, status |
| bnhub_reviews              | listing_id, reviewer_id, created_at; unique(booking_id) |
| bnhub_messages             | booking_id, sender_id, created_at |
| listing_moderation         | listing_id, status, created_at |
| ai_pricing_recommendations | listing_id, created_at |
| ai_fraud_scores            | booking_id, risk_score, created_at |

---

## Entity Relationships (high level)

```
User (host) ──< BnhubListing ──< BnhubListingPhoto
                    │                BnhubListingAmenity >── Amenity
                    │                BnhubAvailability
                    │                ListingModeration
                    │                AiPricingRecommendation
                    └──< BnhubBooking ──< Payment
                              │            BnhubMessage
                              │            BnhubReview
                              │            AiFraudScore
                              └── guest: User
```

- **Host** creates **listings** (1:N).
- **Listing** has **photos**, **amenities** (M:N via junction), **availability** rows, **moderation** history, **AI pricing** rows.
- **Guest** (User) creates **bookings** (1:N); **booking** belongs to one **listing** and one **guest**.
- **Booking** has **payments**, **messages**, **reviews** (1:1 for review), **AI fraud score**.
- All FKs support **referential integrity** and cascade/set null as appropriate (see Prisma schema).

---

## Supported Flows

| Flow | How the schema supports it |
|------|----------------------------|
| Host creates listing | Insert `users` (role=host), then `bnhub_listings` (host_id), `bnhub_listing_photos`, `bnhub_listing_amenities`, `bnhub_availability`. |
| Guest searches listings | Query `bnhub_listings` with filters on city, country, dates (join `bnhub_availability`), price, capacity; order by relevance/rating. |
| Guest books stay | Check `bnhub_availability` for date range; insert `bnhub_bookings` (status=pending); then confirm and create `payments`. |
| Payment processed | Insert/update `payments` (booking_id, amount, status=completed); update booking status to confirmed when applicable. |
| Reservation created | `bnhub_bookings` row with check_in, check_out, total_price, status; link payments. |
| Guest and host message | Insert `bnhub_messages` (booking_id, sender_id, message). |
| Review after stay | After booking status=completed, insert `bnhub_reviews` (booking_id, listing_id, reviewer_id, rating, comment). |
| Admin moderation | Insert `listing_moderation` (listing_id, status, reviewed_by); optionally update listing status. |
| AI insights | Write to `ai_pricing_recommendations` (listing_id, recommended_price, confidence) and `ai_fraud_scores` (booking_id, risk_score). |

---

## Scaling Notes

- **Listings / search:** Indexes on `city`, `country`, `(city, status)` and optional geo index on `(latitude, longitude)` support fast geographic and filter search. For very large catalogs, consider partitioning `bnhub_listings` by `country` or `city` (e.g. PostgreSQL declarative partitioning).
- **Availability:** `(listing_id, date)` unique index keeps one row per listing per day and speeds range queries for a given listing. For high volume, partition `bnhub_availability` by `date` or by `listing_id` ranges.
- **Bookings:** Composite index `(listing_id, check_in, check_out)` supports “no double booking” checks and listing-level booking lists. Index on `check_in`/`check_out` supports date-range reporting.
- **Payments / messages / reviews:** Indexes on `booking_id` and `created_at` support per-booking lookups and time-ordered feeds.
- **AI tables:** Append-heavy; index on `listing_id`/`booking_id` and `created_at` for “latest by entity” queries. Old rows can be archived or aggregated if needed.

---

## Implementation

- Use the Prisma schema in [BNHUB-production-schema.prisma](BNHUB-production-schema.prisma) to generate the client and migrations. Table names are mapped to the snake_case names above via `@@map`.
- Set `DATABASE_URL` for your PostgreSQL instance (required for `prisma migrate` / `prisma generate`).
- From repo root: `npx prisma migrate dev --schema=docs/database/BNHUB-production-schema.prisma` (or `prisma db push` for prototyping).
- To adopt this schema in the main app, merge or replace the BNHub-related models in `apps/web/prisma/schema.prisma` and run migrations from that app.
