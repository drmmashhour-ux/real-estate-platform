-- Bilingual Syria listings — Arabic required (title_ar, description_ar), English optional.

ALTER TABLE syria_properties ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE syria_properties ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE syria_properties ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE syria_properties ADD COLUMN IF NOT EXISTS description_en TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'syria_properties' AND column_name = 'title'
  ) THEN
    UPDATE syria_properties SET title_ar = title WHERE title_ar IS NULL;
    UPDATE syria_properties SET description_ar = description WHERE description_ar IS NULL;
  END IF;
END $$;

UPDATE syria_properties SET title_ar = '(بدون عنوان)' WHERE title_ar IS NULL OR trim(title_ar) = '';
UPDATE syria_properties SET description_ar = '(لا يوجد وصف)' WHERE description_ar IS NULL OR trim(description_ar) = '';

ALTER TABLE syria_properties ALTER COLUMN title_ar SET NOT NULL;
ALTER TABLE syria_properties ALTER COLUMN description_ar SET NOT NULL;

ALTER TABLE syria_properties DROP COLUMN IF EXISTS title;
ALTER TABLE syria_properties DROP COLUMN IF EXISTS description;
