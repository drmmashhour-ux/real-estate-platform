-- AlterTable
ALTER TABLE "investment_deals" ADD COLUMN "rental_type" TEXT NOT NULL DEFAULT 'LONG_TERM';
ALTER TABLE "investment_deals" ADD COLUMN "nightly_rate" DOUBLE PRECISION;
ALTER TABLE "investment_deals" ADD COLUMN "occupancy_rate" DOUBLE PRECISION;
