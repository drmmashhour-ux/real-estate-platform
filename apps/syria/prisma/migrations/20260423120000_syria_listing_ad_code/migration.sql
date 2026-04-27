-- SY-28: ad codes (e.g. RE-1001) + global monotonic counter

CREATE TABLE "syria_ad_code_sequence" (
    "id" TEXT NOT NULL,
    "next_seq" INTEGER NOT NULL DEFAULT 1000,
    CONSTRAINT "syria_ad_code_sequence_pkey" PRIMARY KEY ("id")
);

INSERT INTO "syria_ad_code_sequence" ("id", "next_seq") VALUES ('global', 1000);

ALTER TABLE "syria_properties" ADD COLUMN "ad_code" TEXT;

-- Backfill: global number by created_at, prefix from category
UPDATE "syria_properties" p
SET "ad_code" = sub.code
FROM (
  SELECT
    id,
    (
      CASE "category"
        WHEN 'real_estate' THEN 'RE'
        WHEN 'cars' THEN 'CA'
        WHEN 'electronics' THEN 'EL'
        WHEN 'furniture' THEN 'FU'
        WHEN 'services' THEN 'SE'
        ELSE 'OT' END
    ) || '-' || (row_number() OVER (ORDER BY "created_at") + 1000)::text
    AS code
  FROM "syria_properties"
) sub
WHERE p.id = sub.id;

CREATE UNIQUE INDEX "syria_properties_ad_code_key" ON "syria_properties"("ad_code");

-- Sync counter to max assigned numeric part (avoids collision with new creates)
UPDATE "syria_ad_code_sequence"
SET "next_seq" = GREATEST(
  1000,
  COALESCE((
    SELECT MAX((regexp_match("ad_code", '(\d+)$'))[1]::integer) FROM "syria_properties" WHERE "ad_code" IS NOT NULL
  ), 0)
);

ALTER TABLE "syria_properties" ALTER COLUMN "ad_code" SET NOT NULL;
