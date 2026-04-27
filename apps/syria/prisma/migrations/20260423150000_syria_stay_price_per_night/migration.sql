-- SYBNB Hub: optional nightly rate for short stays (category = stay)
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "price_per_night" INTEGER;
