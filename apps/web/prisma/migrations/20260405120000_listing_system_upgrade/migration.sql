-- AlterTable
ALTER TABLE "bnhub_listings" ADD COLUMN IF NOT EXISTS "listing_rules_structured" JSONB;

-- AlterTable
ALTER TABLE "bnhub_host_listing_promotions" ADD COLUMN IF NOT EXISTS "promotion_label" TEXT;
