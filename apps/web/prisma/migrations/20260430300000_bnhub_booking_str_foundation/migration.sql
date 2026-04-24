-- BNHub STR foundation: availability blocks, booking nights/guests, price snapshots, audit index.
-- Safe / additive: no drops; backfills best-effort from existing `Booking`, `payments`, `AvailabilitySlot`.

CREATE TYPE "AvailabilityBlockType" AS ENUM ('HOST_BLOCK', 'BOOKING_HOLD', 'MAINTENANCE');

CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "blockType" "AvailabilityBlockType" NOT NULL,
    "sourceBookingId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingNight" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "stayDate" DATE NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "BookingNight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingGuest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingGuest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AvailabilityBlock"
ADD CONSTRAINT "AvailabilityBlock_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AvailabilityBlock"
ADD CONSTRAINT "AvailabilityBlock_sourceBookingId_fkey"
FOREIGN KEY ("sourceBookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BookingNight"
ADD CONSTRAINT "BookingNight_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingNight"
ADD CONSTRAINT "BookingNight_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingGuest"
ADD CONSTRAINT "BookingGuest_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "AvailabilityBlock_listingId_startDate_endDate_idx" ON "AvailabilityBlock"("listingId", "startDate", "endDate");

CREATE UNIQUE INDEX "BookingNight_listingId_stayDate_bookingId_key" ON "BookingNight"("listingId", "stayDate", "bookingId");

CREATE INDEX "BookingNight_listingId_stayDate_idx" ON "BookingNight"("listingId", "stayDate");

CREATE INDEX "BookingGuest_bookingId_idx" ON "BookingGuest"("bookingId");

ALTER TABLE "Booking" ADD COLUMN "price_snapshot_subtotal_cents" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "price_snapshot_fees_cents" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "price_snapshot_taxes_cents" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "price_snapshot_total_cents" INTEGER;

CREATE INDEX "Booking_listingId_checkIn_checkOut_idx" ON "Booking"("listingId", "checkIn", "checkOut");

CREATE INDEX "BnhubBookingEvent_bookingId_createdAt_idx" ON "BnhubBookingEvent"("bookingId", "createdAt");

-- Best-effort price snapshots: legacy `totalCents` is lodging subtotal on the row; taxes often unknown (0).
UPDATE "Booking" AS b
SET
  "price_snapshot_subtotal_cents" = b."totalCents",
  "price_snapshot_fees_cents" = COALESCE(b."guestFeeCents", 0),
  "price_snapshot_taxes_cents" = 0,
  "price_snapshot_total_cents" = COALESCE(
    (SELECT p."amountCents" FROM "payments" p WHERE p."bookingId" = b."id" LIMIT 1),
    b."totalCents" + COALESCE(b."guestFeeCents", 0)
  )
WHERE b."price_snapshot_total_cents" IS NULL;

-- Occupied nights from calendar slots (primary backfill).
INSERT INTO "BookingNight" ("id", "listingId", "stayDate", "bookingId")
SELECT gen_random_uuid()::text, s."listingId", (s."date"::timestamp)::date, s."booked_by_booking_id"
FROM "AvailabilitySlot" s
WHERE s."booked_by_booking_id" IS NOT NULL
ON CONFLICT ("listingId", "stayDate", "bookingId") DO NOTHING;

-- Fill gaps for active bookings if slots were missing historically.
INSERT INTO "BookingNight" ("id", "listingId", "stayDate", "bookingId")
SELECT gen_random_uuid()::text, b."listingId", gs.stay_date::date, b."id"
FROM "Booking" b
CROSS JOIN LATERAL generate_series(
  b."checkIn"::date,
  b."checkOut"::date - 1,
  '1 day'::interval
) AS gs(stay_date)
WHERE b."checkOut"::date > b."checkIn"::date
  AND b."status" IN ('PENDING', 'AWAITING_HOST_APPROVAL', 'CONFIRMED', 'COMPLETED', 'DISPUTED')
ON CONFLICT ("listingId", "stayDate", "bookingId") DO NOTHING;
