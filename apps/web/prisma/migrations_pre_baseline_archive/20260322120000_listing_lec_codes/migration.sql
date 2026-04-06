-- Human-readable immutable listing codes: LEC-##### (shared sequence for BNHub + CRM Listing)

CREATE SEQUENCE IF NOT EXISTS lec_listing_code_seq INCREMENT BY 1 MINVALUE 1 START WITH 10001;

-- BNHub short-term listings
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "listing_code" TEXT;

UPDATE "bnhub_listings"
SET "listing_code" = 'LEC-' || nextval('lec_listing_code_seq')::text
WHERE "listing_code" IS NULL;

ALTER TABLE "bnhub_listings" ALTER COLUMN "listing_code" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "bnhub_listings_listing_code_key" ON "bnhub_listings"("listing_code");

-- Broker CRM Listing (Prisma model Listing)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "listing_code" TEXT;

UPDATE "Listing"
SET "listing_code" = 'LEC-' || nextval('lec_listing_code_seq')::text
WHERE "listing_code" IS NULL;

ALTER TABLE "Listing" ALTER COLUMN "listing_code" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Listing_listing_code_key" ON "Listing"("listing_code");

-- Lead: denormalized code for CRM search
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "listing_code" TEXT;
CREATE INDEX IF NOT EXISTS "Lead_listing_code_idx" ON "Lead"("listing_code");

UPDATE "Lead" l
SET "listing_code" = bl."listing_code"
FROM "bnhub_listings" bl
WHERE l."listingId" = bl.id AND (l."listing_code" IS NULL OR l."listing_code" = '');

-- Deal
ALTER TABLE deals ADD COLUMN IF NOT EXISTS listing_code TEXT;
CREATE INDEX IF NOT EXISTS deals_listing_code_idx ON deals(listing_code);

UPDATE deals d
SET listing_code = bl.listing_code
FROM bnhub_listings bl
WHERE d.listing_id = bl.id AND (d.listing_code IS NULL OR d.listing_code = '');

-- Booking messages (guest–host thread)
ALTER TABLE "BookingMessage" ADD COLUMN IF NOT EXISTS "listing_code" TEXT;
CREATE INDEX IF NOT EXISTS "BookingMessage_listing_code_idx" ON "BookingMessage"("listing_code");

UPDATE "BookingMessage" bm
SET "listing_code" = bl.listing_code
FROM "Booking" b
INNER JOIN "bnhub_listings" bl ON bl.id = b."listingId"
WHERE bm."bookingId" = b.id AND (bm."listing_code" IS NULL OR bm."listing_code" = '');

-- Keep sequence ahead of max assigned numeric suffix
SELECT setval(
  'lec_listing_code_seq',
  GREATEST(
    10000,
    COALESCE(
      (
        SELECT MAX(CAST(regexp_replace(lc, '^LEC-', '') AS BIGINT))
        FROM (
          SELECT "listing_code" AS lc FROM "bnhub_listings"
          UNION ALL
          SELECT "listing_code" AS lc FROM "Listing"
        ) u
        WHERE lc ~ '^LEC-[0-9]+$'
      ),
      10000
    )
  )::bigint
);
