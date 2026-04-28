-- SYBNB-39: SyriaPropertyType.HOTEL + optional hotel identity fields.

DO $$ BEGIN
  ALTER TYPE "SyriaPropertyType" ADD VALUE 'HOTEL';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "hotel_name" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "rooms_available" INTEGER;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "reception_available" BOOLEAN;
