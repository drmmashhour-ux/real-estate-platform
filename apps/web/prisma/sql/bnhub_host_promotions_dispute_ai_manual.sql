-- Optional manual migration (if `prisma migrate` is blocked in your environment).
-- Aligns DB with schema: BnhubHostListingPromotion + Dispute AI assistant fields.

CREATE TABLE IF NOT EXISTS "bnhub_host_listing_promotions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "listing_id" TEXT NOT NULL,
  "discount_percent" INTEGER NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bnhub_host_listing_promotions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bnhub_host_listing_promotions_listing_id_idx"
  ON "bnhub_host_listing_promotions"("listing_id");
CREATE INDEX IF NOT EXISTS "bnhub_host_listing_promotions_start_date_end_date_idx"
  ON "bnhub_host_listing_promotions"("start_date", "end_date");

DO $$ BEGIN
  ALTER TABLE "bnhub_host_listing_promotions"
    ADD CONSTRAINT "bnhub_host_listing_promotions_listing_id_fkey"
    FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "ai_assistant_recommendation" TEXT;
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "ai_assistant_summary" TEXT;
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "ai_assistant_generated_at" TIMESTAMP(3);
