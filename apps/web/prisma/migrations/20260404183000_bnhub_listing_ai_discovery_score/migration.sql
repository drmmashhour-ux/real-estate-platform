-- Optional 0-100 cached AI discovery score for BNHub stays (search computes live scores regardless).
ALTER TABLE "bnhub_listings" ADD COLUMN "ai_discovery_score" INTEGER;
