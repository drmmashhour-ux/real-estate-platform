-- LECIPM production integration: canonical bigint listings, Stripe subscription sync, CRM extensions.
-- Legacy "Property" (uuid) and fsbo_listings (cuid) remain unchanged; optional link via properties.fsbo_listing_id.

-- ---------------------------------------------------------------------------
-- Canonical listing row (bigint identity) — align new domain tables here first.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "properties" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "owner_user_id" TEXT,
    "broker_user_id" TEXT,
    "fsbo_listing_id" TEXT UNIQUE,
    "mode" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "price" DECIMAL(12, 2),
    "address_line1" TEXT,
    "unit_number" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CA',
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL(4, 1),
    "area_sqft" DECIMAL(10, 2),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "plan_type" TEXT NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "properties_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "properties_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "properties_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_properties_status" ON "properties"("status");
CREATE INDEX IF NOT EXISTS "idx_properties_owner_user_id" ON "properties"("owner_user_id");
CREATE INDEX IF NOT EXISTS "idx_properties_broker_user_id" ON "properties"("broker_user_id");
CREATE INDEX IF NOT EXISTS "idx_properties_mode_type" ON "properties"("mode", "property_type");
CREATE INDEX IF NOT EXISTS "idx_properties_city_price" ON "properties"("city", "price");

-- ---------------------------------------------------------------------------
-- Media for canonical listings (separate from legacy property_media → Property uuid)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "listing_property_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" BIGINT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "media_kind" TEXT NOT NULL,
    "media_tag" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "file_hash" TEXT,
    "perceptual_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listing_property_media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_listing_property_media_listing_id" ON "listing_property_media"("listing_id");
CREATE INDEX IF NOT EXISTS "idx_listing_property_media_file_hash" ON "listing_property_media"("file_hash");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listing_property_media_listing_id_fkey'
  ) THEN
    ALTER TABLE "listing_property_media"
      ADD CONSTRAINT "listing_property_media_listing_id_fkey"
      FOREIGN KEY ("listing_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Structured seller declaration (optional; FSBO still stores JSON on fsbo_listings)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "seller_declarations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" BIGINT NOT NULL,
    "seller_user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "answers" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "completion_percent" DECIMAL(5, 2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_declarations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_seller_declarations_listing_id" ON "seller_declarations"("listing_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seller_declarations_listing_id_fkey'
  ) THEN
    ALTER TABLE "seller_declarations"
      ADD CONSTRAINT "seller_declarations_listing_id_fkey"
      FOREIGN KEY ("listing_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seller_declarations_seller_user_id_fkey'
  ) THEN
    ALTER TABLE "seller_declarations"
      ADD CONSTRAINT "seller_declarations_seller_user_id_fkey"
      FOREIGN KEY ("seller_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Stripe subscription mirror (webhook source of truth for LECIPM workspace plans)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "stripe_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID,
    "user_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT UNIQUE,
    "plan_code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_stripe_subscriptions_user_id" ON "stripe_subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_stripe_subscriptions_workspace_id" ON "stripe_subscriptions"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_stripe_subscriptions_stripe_customer_id" ON "stripe_subscriptions"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_stripe_subscriptions_status" ON "stripe_subscriptions"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stripe_subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE "stripe_subscriptions"
      ADD CONSTRAINT "stripe_subscriptions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Copilot long-term memory scaffolding (embeddings column optional / future pgvector)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "copilot_memory_chunks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "content_text" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "copilot_memory_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_copilot_memory_chunks_user_scope" ON "copilot_memory_chunks"("user_id", "scope");
CREATE INDEX IF NOT EXISTS "idx_copilot_memory_chunks_ref" ON "copilot_memory_chunks"("ref_type", "ref_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'copilot_memory_chunks_user_id_fkey'
  ) THEN
    ALTER TABLE "copilot_memory_chunks"
      ADD CONSTRAINT "copilot_memory_chunks_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Deal analyzer: optional link to canonical listing (nullable; existing FSBO id unchanged)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'deal_analyses' AND column_name = 'canonical_property_id'
  ) THEN
    ALTER TABLE "deal_analyses" ADD COLUMN "canonical_property_id" BIGINT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_deal_analyses_canonical_property_id" ON "deal_analyses"("canonical_property_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deal_analyses_canonical_property_id_fkey'
  ) THEN
    ALTER TABLE "deal_analyses"
      ADD CONSTRAINT "deal_analyses_canonical_property_id_fkey"
      FOREIGN KEY ("canonical_property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- CRM: owner + updated_at
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_leads' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE "crm_leads" ADD COLUMN "owner_user_id" TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'crm_leads' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "crm_leads" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_crm_leads_owner_user_id" ON "crm_leads"("owner_user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_owner_user_id_fkey'
  ) THEN
    ALTER TABLE "crm_leads"
      ADD CONSTRAINT "crm_leads_owner_user_id_fkey"
      FOREIGN KEY ("owner_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse single function)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION lecipm_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_properties_updated_at ON "properties";
CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON "properties"
  FOR EACH ROW EXECUTE PROCEDURE lecipm_set_updated_at();

DROP TRIGGER IF EXISTS trg_seller_declarations_updated_at ON "seller_declarations";
CREATE TRIGGER trg_seller_declarations_updated_at
  BEFORE UPDATE ON "seller_declarations"
  FOR EACH ROW EXECUTE PROCEDURE lecipm_set_updated_at();

DROP TRIGGER IF EXISTS trg_stripe_subscriptions_updated_at ON "stripe_subscriptions";
CREATE TRIGGER trg_stripe_subscriptions_updated_at
  BEFORE UPDATE ON "stripe_subscriptions"
  FOR EACH ROW EXECUTE PROCEDURE lecipm_set_updated_at();

DROP TRIGGER IF EXISTS trg_crm_leads_updated_at ON "crm_leads";
CREATE TRIGGER trg_crm_leads_updated_at
  BEFORE UPDATE ON "crm_leads"
  FOR EACH ROW EXECUTE PROCEDURE lecipm_set_updated_at();
