-- Phase 3: monetization rails, growth events, featured placements, autonomy recommendations, booking ledger snapshots, UTM.

-- Enum types (idempotent-ish)
DO $$ BEGIN CREATE TYPE "SyriaPaymentMethod" AS ENUM ('MANUAL_TRANSFER', 'CASH', 'LOCAL_GATEWAY_PLACEHOLDER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SyriaPromotionZone" AS ENUM ('HOME', 'CATEGORY', 'CITY', 'SEARCH_BOOST'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SyriaAutonomyRecommendationStatus" AS ENUM ('PENDING', 'DISMISSED', 'ACKNOWLEDGED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TYPE "SyriaListingPaymentPurpose" ADD VALUE 'BNHUB_LISTING'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "SyriaBookingPaymentStatus" ADD VALUE 'HELD'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "featured_priority" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "syria_inquiries" ADD COLUMN IF NOT EXISTS "utm_source" TEXT;
ALTER TABLE "syria_inquiries" ADD COLUMN IF NOT EXISTS "utm_medium" TEXT;
ALTER TABLE "syria_inquiries" ADD COLUMN IF NOT EXISTS "utm_campaign" TEXT;

ALTER TABLE "syria_listing_payments" ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT;
ALTER TABLE "syria_listing_payments" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3);
ALTER TABLE "syria_listing_payments" DROP CONSTRAINT IF EXISTS "syria_listing_payments_reviewed_by_fkey";
ALTER TABLE "syria_listing_payments" ADD CONSTRAINT "syria_listing_payments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "syria_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'syria_listing_payments' AND column_name = 'payment_method' AND data_type <> 'USER-DEFINED'
  ) THEN
    ALTER TABLE "syria_listing_payments" ALTER COLUMN "payment_method" DROP DEFAULT;
    ALTER TABLE "syria_listing_payments" ALTER COLUMN "payment_method" TYPE "SyriaPaymentMethod"
      USING (
        CASE trim(lower(coalesce(payment_method::text, '')))
          WHEN 'cash' THEN 'CASH'::"SyriaPaymentMethod"
          WHEN 'manual' THEN 'MANUAL_TRANSFER'::"SyriaPaymentMethod"
          WHEN 'manual_transfer' THEN 'MANUAL_TRANSFER'::"SyriaPaymentMethod"
          WHEN 'local_gateway_placeholder' THEN 'LOCAL_GATEWAY_PLACEHOLDER'::"SyriaPaymentMethod"
          ELSE 'MANUAL_TRANSFER'::"SyriaPaymentMethod"
        END
      );
    ALTER TABLE "syria_listing_payments" ALTER COLUMN "payment_method" SET DEFAULT 'MANUAL_TRANSFER'::"SyriaPaymentMethod";
    ALTER TABLE "syria_listing_payments" ALTER COLUMN "payment_method" SET NOT NULL;
  END IF;
END $$;

ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "nights_count" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "nightly_rate" DECIMAL(14,2);
ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "platform_fee_amount" DECIMAL(14,2);
ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "host_net_amount" DECIMAL(14,2);
ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "utm_source" TEXT;
ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "utm_medium" TEXT;
ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "utm_campaign" TEXT;

UPDATE "syria_bookings" b SET "nightly_rate" = "total_price" WHERE "nightly_rate" IS NULL;

UPDATE "syria_bookings" b
SET
  "platform_fee_amount" = p."platform_fee",
  "host_net_amount" = p."amount"
FROM "syria_payouts" p
WHERE p."booking_id" = b."id";

CREATE TABLE IF NOT EXISTS "syria_featured_placements" (
  "id" TEXT NOT NULL,
  "property_id" TEXT NOT NULL,
  "zone" "SyriaPromotionZone" NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3),
  "linked_listing_payment_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "syria_featured_placements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "syria_featured_placements_zone_active_priority_idx" ON "syria_featured_placements"("zone", "active", "priority");
CREATE INDEX IF NOT EXISTS "syria_featured_placements_property_id_idx" ON "syria_featured_placements"("property_id");
ALTER TABLE "syria_featured_placements" DROP CONSTRAINT IF EXISTS "syria_featured_placements_property_id_fkey";
ALTER TABLE "syria_featured_placements" ADD CONSTRAINT "syria_featured_placements_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "syria_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "syria_growth_events" (
  "id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "user_id" TEXT,
  "property_id" TEXT,
  "booking_id" TEXT,
  "inquiry_id" TEXT,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "syria_growth_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "syria_growth_events_event_type_created_at_idx" ON "syria_growth_events"("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "syria_growth_events_utm_campaign_idx" ON "syria_growth_events"("utm_campaign");

CREATE TABLE IF NOT EXISTS "syria_autonomy_recommendations" (
  "id" TEXT NOT NULL,
  "property_id" TEXT,
  "user_id" TEXT,
  "action_type" TEXT NOT NULL,
  "status" "SyriaAutonomyRecommendationStatus" NOT NULL DEFAULT 'PENDING',
  "payload" JSONB NOT NULL DEFAULT '{}',
  "autonomy_mode" TEXT NOT NULL,
  "explanation" TEXT,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "syria_autonomy_recommendations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "syria_autonomy_recommendations_status_created_at_idx" ON "syria_autonomy_recommendations"("status", "created_at");
CREATE INDEX IF NOT EXISTS "syria_autonomy_recommendations_property_id_idx" ON "syria_autonomy_recommendations"("property_id");
ALTER TABLE "syria_autonomy_recommendations" DROP CONSTRAINT IF EXISTS "syria_autonomy_recommendations_property_id_fkey";
ALTER TABLE "syria_autonomy_recommendations" ADD CONSTRAINT "syria_autonomy_recommendations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "syria_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "syria_autonomy_recommendations" DROP CONSTRAINT IF EXISTS "syria_autonomy_recommendations_user_id_fkey";
ALTER TABLE "syria_autonomy_recommendations" ADD CONSTRAINT "syria_autonomy_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "syria_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
