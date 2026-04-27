-- SY-22: direct deal (no broker) — default true for existing rows
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "is_direct" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "syria_properties_is_direct_idx" ON "syria_properties"("is_direct");
