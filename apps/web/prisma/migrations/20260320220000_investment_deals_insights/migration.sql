-- Deterministic risk score + rating for saved investment deals
ALTER TABLE "investment_deals" ADD COLUMN IF NOT EXISTS "risk_score" DOUBLE PRECISION NOT NULL DEFAULT 50;
ALTER TABLE "investment_deals" ADD COLUMN IF NOT EXISTS "rating" TEXT NOT NULL DEFAULT 'Moderate Investment';
