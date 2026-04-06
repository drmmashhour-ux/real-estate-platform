-- Remove per-listing / per-market flat tax %; BNHub + invoices use lib/tax/quebec-tax-engine (GST + compound QST).

ALTER TABLE "bnhub_listings" DROP COLUMN IF EXISTS "taxRatePercent";

ALTER TABLE "MarketConfig" DROP COLUMN IF EXISTS "taxRatePercent";
