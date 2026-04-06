-- City + market comparison (mock benchmarks)
ALTER TABLE "investment_deals" ADD COLUMN IF NOT EXISTS "city" TEXT NOT NULL DEFAULT 'Montreal';
ALTER TABLE "investment_deals" ADD COLUMN IF NOT EXISTS "market_comparison" TEXT NOT NULL DEFAULT 'Market Average';
