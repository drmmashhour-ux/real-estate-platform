-- Convert `amenities` from JSONB (legacy `[]` / string arrays) to PostgreSQL `text[]`.

ALTER TABLE "syria_properties" ALTER COLUMN "amenities" DROP DEFAULT;

ALTER TABLE "syria_properties"
  ALTER COLUMN "amenities" TYPE text[]
  USING (
    CASE
      WHEN "amenities" IS NULL
        OR jsonb_typeof("amenities"::jsonb) IS DISTINCT FROM 'array' THEN ARRAY[]::text[]
      ELSE COALESCE(ARRAY(SELECT jsonb_array_elements_text("amenities"::jsonb)), ARRAY[]::text[])
    END
  );

ALTER TABLE "syria_properties" ALTER COLUMN "amenities" SET DEFAULT ARRAY[]::text[];
