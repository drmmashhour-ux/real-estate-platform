# Listing Service

Property listing creation, images, amenities, house rules, location data, and moderation status for LECIPM.

**Reference:** [Database Schema Blueprint](../../docs/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) §3, [API Architecture Blueprint](../../docs/LECIPM-API-ARCHITECTURE-BLUEPRINT.md).

---

## Features

- **Property listing creation** — POST with type (marketplace_sale, marketplace_rent, bnhub), title, description, address, location, pricing, etc.
- **Property images** — Array of URLs with sort order (stored in `property_images`).
- **Amenities** — List of amenity keys (e.g. wifi, parking) in `property_amenities`.
- **House rules** — Optional text field.
- **Location data** — address, city, region, country, latitude, longitude.
- **Listing moderation status** — DRAFT | PENDING_REVIEW | LIVE | SUSPENDED | ARCHIVED.

---

## Database models

- **Property** — ownerId, brokerId?, type, status, title, description, propertyType, address, city, region, country, lat/lng, priceCents, currency, nightlyPriceCents, cleaningFeeCents, maxGuests, bedrooms, beds, baths, check-in/out, houseRules, min/max nights, registrationNumber, reviewedAt, rejectionReason, timestamps, deletedAt.
- **PropertyImage** — propertyId, url, type (PHOTO), sortOrder.
- **PropertyAmenity** — propertyId, amenityKey (unique per property).

Run `npm run db:generate` and `npm run db:push` to create tables.

---

## REST API (base path `/v1/properties`)

All endpoints require `Authorization: Bearer <access_token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create property (ownerId from JWT). Body: type, title, address, city, optional description, location, pricing, images[], amenities[], houseRules, etc. |
| GET | `/` | List properties. Query: page, pageSize, ownerId?, status?, type?, city?, country?. Non-admins see only LIVE unless filtering by own ownerId. |
| GET | `/:id` | Get property by id. Non-owners see only LIVE listings. |
| PATCH | `/:id` | Update property (owner or admin). Partial body; can set status (e.g. LIVE sets reviewedAt). |
| DELETE | `/:id` | Soft delete (set deletedAt, status ARCHIVED). Owner or admin only. |

---

## Setup

```bash
cd services/listing-service
cp .env.example .env   # set DATABASE_URL, JWT_ACCESS_SECRET
npm install
npm run db:generate && npm run db:push
npm run dev            # port 3003
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with tsx watch (port 3003) |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled dist |
| `npm test` | Run unit tests |
| `npm run db:generate` | Prisma generate |
| `npm run db:push` | Push schema |
