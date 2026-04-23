-- Phase 2: marketplace filters, inquiries, ARCHIVED status

CREATE TABLE IF NOT EXISTS "syria_inquiries" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "from_user_id" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "syria_inquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "syria_inquiries_property_id_idx" ON "syria_inquiries"("property_id");

ALTER TABLE "syria_inquiries" DROP CONSTRAINT IF EXISTS "syria_inquiries_property_id_fkey";
ALTER TABLE "syria_inquiries" ADD CONSTRAINT "syria_inquiries_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "syria_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "syria_inquiries" DROP CONSTRAINT IF EXISTS "syria_inquiries_from_user_id_fkey";
ALTER TABLE "syria_inquiries" ADD CONSTRAINT "syria_inquiries_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "syria_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "neighborhood" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "bedrooms" INTEGER;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "bathrooms" INTEGER;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "furnished" BOOLEAN;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "property_category" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "guests_max" INTEGER;

ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "guest_count" INTEGER;

DO $$ BEGIN
  ALTER TYPE "SyriaPropertyStatus" ADD VALUE 'ARCHIVED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
