-- Optional admin override for default lead unlock price (CAD cents)
ALTER TABLE "platform_financial_settings" ADD COLUMN IF NOT EXISTS "revenue_lead_default_price_cents" INTEGER;
