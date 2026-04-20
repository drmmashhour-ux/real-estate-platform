-- Non-destructive bilingual location fields on syria_properties.

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "city_ar" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "city_en" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "district_ar" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "district_en" TEXT;

UPDATE "syria_properties"
SET "city_en" = "city"
WHERE "city_en" IS NULL AND "city" IS NOT NULL AND trim("city") <> '';
