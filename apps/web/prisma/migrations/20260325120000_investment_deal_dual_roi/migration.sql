-- AlterTable
ALTER TABLE "investment_deals" ADD COLUMN "roi_long_term" DOUBLE PRECISION;
ALTER TABLE "investment_deals" ADD COLUMN "roi_short_term" DOUBLE PRECISION;
ALTER TABLE "investment_deals" ADD COLUMN "preferred_strategy" TEXT NOT NULL DEFAULT 'LONG_TERM';

-- Backfill from legacy single-strategy rows
UPDATE "investment_deals"
SET "roi_long_term" = "roi"
WHERE "rental_type" = 'LONG_TERM' OR "rental_type" IS NULL;

UPDATE "investment_deals"
SET "roi_short_term" = "roi"
WHERE "rental_type" = 'SHORT_TERM';

UPDATE "investment_deals"
SET "preferred_strategy" = COALESCE(NULLIF(TRIM("rental_type"), ''), 'LONG_TERM');
