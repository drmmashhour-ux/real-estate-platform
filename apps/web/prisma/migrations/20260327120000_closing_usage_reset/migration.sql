-- Closing system: optional monthly reset + usage period key on growth_usage_counters
ALTER TABLE "growth_usage_counters" ADD COLUMN IF NOT EXISTS "reset_period" TEXT NOT NULL DEFAULT 'lifetime';
ALTER TABLE "growth_usage_counters" ADD COLUMN IF NOT EXISTS "usage_period_key" TEXT;
