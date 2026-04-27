-- Marketplace categories (additive; backfill from legacy `type`)
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "marketplace_category" TEXT NOT NULL DEFAULT 'real_estate';
ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "marketplace_subcategory" TEXT NOT NULL DEFAULT 'sale';

UPDATE "syria_properties" SET
  "marketplace_subcategory" = CASE "type"::text
    WHEN 'SALE' THEN 'sale'
    WHEN 'RENT' THEN 'rent'
    WHEN 'BNHUB' THEN 'hotel'
    ELSE 'sale'
  END
WHERE "marketplace_subcategory" = 'sale' OR "marketplace_subcategory" IS NULL;

CREATE INDEX IF NOT EXISTS "syria_properties_category_subcategory_idx" ON "syria_properties" ("marketplace_category", "marketplace_subcategory");
CREATE INDEX IF NOT EXISTS "syria_properties_marketplace_category_idx" ON "syria_properties" ("marketplace_category");
