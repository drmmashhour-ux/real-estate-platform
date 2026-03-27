# Booking Service

BNHub booking system: availability calendar, booking creation, status transitions, check-in/check-out tracking, and price calculation.

## Features

- **Availability calendar** — GET `/v1/availability?listingId=&start=&end=` returns slots for a listing in a date range.
- **Booking creation** — POST `/v1/bookings` with `listingId`, `guestId`, `checkIn`, `checkOut` (and optional `guestNotes`). Availability is checked; price is calculated (nightly rate × nights + guest/host fees).
- **Booking status transitions** — PENDING → CONFIRMED (e.g. after payment), CONFIRMED → COMPLETED; PENDING/CONFIRMED → CANCELLED via cancel endpoint.
- **Check-in / check-out tracking** — PATCH `/v1/bookings/:id` can set `checkedInAt` and `checkedOutAt` (ISO datetime).
- **Price calculation** — On create: `totalCents`, `guestFeeCents`, `hostFeeCents`; a linked `Payment` record with `amountCents` (guest total), `hostPayoutCents`.

## APIs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/bookings` | Create booking (body: `listingId`, `guestId`, `checkIn`, `checkOut`, optional `guestNotes`) |
| GET | `/v1/bookings/:bookingId` | Get booking by ID |
| PATCH | `/v1/bookings/:bookingId` | Update booking (`guestNotes`, `checkedInAt`, `checkedOutAt`) |
| POST | `/v1/bookings/:bookingId/cancel` | Cancel a PENDING or CONFIRMED booking |
| GET | `/v1/availability` | Availability calendar (query: `listingId`, `start`, `end` — ISO dates) |

## Configuration

- `PORT` — default `3005`
- `DATABASE_URL` — PostgreSQL connection string (required)

When sharing the database with the web-app BNHub, ensure the `Booking` table has `checkedInAt` and `checkedOutAt` (e.g. run `npx prisma db push` from this service once).

## Scripts

```bash
npm run build      # compile TypeScript
npm run dev        # run with tsx watch
npm run start      # run dist/index.js
npm run db:generate
npm run db:push
npm run db:migrate
```

## Reference

- [API Architecture Blueprint](../../docs/LECIPM-API-ARCHITECTURE-BLUEPRINT.md), [Database Blueprint](../../docs/LECIPM-DATABASE-SCHEMA-BLUEPRINT.md) §5.
- Build order: Phase 5 — [Build Order](../../docs/LECIPM-BUILD-ORDER.md).
