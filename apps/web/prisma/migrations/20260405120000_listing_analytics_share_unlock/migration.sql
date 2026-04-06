-- AlterTable
ALTER TABLE "listing_analytics" ADD COLUMN "share_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "listing_analytics" ADD COLUMN "unlock_checkout_starts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "listing_analytics" ADD COLUMN "unlock_checkout_successes" INTEGER NOT NULL DEFAULT 0;
