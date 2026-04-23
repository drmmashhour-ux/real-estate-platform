-- Hybrid location: governorate + optional place label from Google / user.
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "governorate" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "place_name" TEXT;
CREATE INDEX IF NOT EXISTS "syria_properties_governorate_idx" ON "syria_properties" ("governorate");
