# Review Service

Guest reviews, host reviews, listing ratings, reputation scores, and review moderation.

## Features

- **Guest reviews** — One review per completed booking: property rating (1–5), optional host rating (1–5), optional comment.
- **Host reviews** — Stored as `hostRating` on the same review; aggregated in user reputation.
- **Listing ratings** — GET `/ratings/listing/:listingId` returns average property rating, average host rating, count, and breakdown (1–5).
- **Reputation scores** — GET `/ratings/user/:userId` returns as-host (received host ratings) and as-guest (given property ratings) with review count and average; reputation score = average × 20 (0–100 scale).
- **Review moderation** — New reviews start as `PENDING`; moderators can `APPROVED` or `REJECTED` via PATCH with optional `rejectionReason`. List endpoint defaults to `APPROVED` only.

## APIs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/reviews` | Create review (body: `bookingId`, `guestId`, `listingId`, `propertyRating`, optional `hostRating`, `comment`) |
| GET | `/v1/reviews` | List reviews (query: `listingId`, `guestId`, `hostId`, `status`, `limit`, `offset`; default status APPROVED) |
| PATCH | `/v1/reviews/:reviewId` | Moderate (body: `status` APPROVED\|REJECTED, optional `moderatorId`, `rejectionReason`) |
| GET | `/v1/ratings/listing/:listingId` | Listing ratings (avg, count, breakdown, host avg) |
| GET | `/v1/ratings/user/:userId` | User reputation (as host + as guest) |

## Configuration

- `PORT` — default `3008`
- `DATABASE_URL` — PostgreSQL connection string (required). Can share DB with web-app/booking-service; run `npx prisma db push` from this service to add moderation columns to `Review` if needed.

## Scripts

```bash
npm run build
npm run dev
npm run start
npm run db:generate
npm run db:push
npm run db:migrate
```

## Reference

- [API Architecture Blueprint](../../docs/LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Database Blueprint](../../docs/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) §8.
- Build order: Phase 7 — [Build Order](../../docs/LECIPM-BUILD-ORDER.md).
