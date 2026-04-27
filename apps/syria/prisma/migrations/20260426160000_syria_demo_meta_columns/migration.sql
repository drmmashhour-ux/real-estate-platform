-- Optional investor-demo tagging columns (additive). Safe when columns already exist.
ALTER TABLE "syria_users" ADD COLUMN IF NOT EXISTS "demo_meta" JSONB;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "demo_meta" JSONB;
ALTER TABLE "syria_bookings" ADD COLUMN IF NOT EXISTS "demo_meta" JSONB;
