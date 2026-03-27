-- FSBO: hot-path for dashboards / feeds
CREATE INDEX IF NOT EXISTS "idx_fsbo_listings_updated_at_desc" ON "fsbo_listings"("updated_at" DESC);

-- TrustGraph: latest case per entity (LISTING + id)
CREATE INDEX IF NOT EXISTS "idx_verification_cases_entity_updated" ON "verification_cases"("entity_type", "entity_id", "updated_at" DESC);

-- Legacy Property model: indexes only when columns exist (schema may have drifted vs early migrations)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Property' AND column_name = 'ownerId'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "idx_properties_owner_id" ON "Property"("ownerId")';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Property' AND column_name = 'createdAt'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "idx_properties_created_at_desc" ON "Property"("createdAt" DESC)';
  END IF;
END $$;

-- Normalized media for Property (optional)
CREATE TABLE IF NOT EXISTS "property_media" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "media_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "property_media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_property_media_property_id" ON "property_media"("property_id");
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Property'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'property_media_property_id_fkey'
  ) THEN
    ALTER TABLE "property_media" ADD CONSTRAINT "property_media_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
