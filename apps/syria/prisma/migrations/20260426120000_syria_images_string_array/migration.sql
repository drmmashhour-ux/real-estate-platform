-- `images` from JSONB array to text[] (URLs or data URLs).

ALTER TABLE "syria_properties" ALTER COLUMN "images" DROP DEFAULT;

ALTER TABLE "syria_properties"
  ALTER COLUMN "images" TYPE text[]
  USING (
    CASE
      WHEN "images" IS NULL
        OR jsonb_typeof("images"::jsonb) IS DISTINCT FROM 'array' THEN ARRAY[]::text[]
      ELSE COALESCE(ARRAY(SELECT jsonb_array_elements_text("images"::jsonb)), ARRAY[]::text[])
    END
  );

ALTER TABLE "syria_properties" ALTER COLUMN "images" SET DEFAULT ARRAY[]::text[];
