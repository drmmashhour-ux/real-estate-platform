-- Link marketplace FSBO DM threads to `fsbo_listings` without using CRM `listing_id`.

ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "fsbo_listing_id" VARCHAR(64);

CREATE INDEX IF NOT EXISTS "conversations_fsbo_listing_id_idx" ON "conversations"("fsbo_listing_id");

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_fsbo_listing_id_fkey"
  FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
