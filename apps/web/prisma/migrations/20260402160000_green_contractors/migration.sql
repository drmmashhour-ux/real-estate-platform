-- Green contractor marketplace (Québec-oriented matching — not endorsements)

CREATE TABLE "contractors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "services" TEXT[] NOT NULL,
    "region" VARCHAR(128) NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "premium_listing" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contractors_region_idx" ON "contractors"("region");

CREATE TABLE "green_contractor_reviews" (
    "id" TEXT NOT NULL,
    "contractor_id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "body" TEXT,
    "author_label" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "green_contractor_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "green_contractor_reviews_contractor_id_idx" ON "green_contractor_reviews"("contractor_id");

ALTER TABLE "green_contractor_reviews" ADD CONSTRAINT "green_contractor_reviews_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "green_upgrade_quote_requests" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36),
    "contractor_id" TEXT,
    "project_description" TEXT NOT NULL,
    "upgrade_hints" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "region" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "green_upgrade_quote_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "green_upgrade_quote_requests_user_id_idx" ON "green_upgrade_quote_requests"("user_id");
CREATE INDEX "green_upgrade_quote_requests_contractor_id_idx" ON "green_upgrade_quote_requests"("contractor_id");

ALTER TABLE "green_upgrade_quote_requests" ADD CONSTRAINT "green_upgrade_quote_requests_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "contractors" ("id", "name", "services", "region", "rating", "premium_listing", "created_at", "updated_at")
VALUES
  ('contractor_seed_hp_1', 'Thermo Nordic Solutions (illustrative)', ARRAY['heat_pump', 'ventilation']::TEXT[], 'Quebec', 4.7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('contractor_seed_env_1', 'Envelope Pro Québec (illustrative)', ARRAY['insulation', 'windows', 'air_sealing']::TEXT[], 'Montreal', 4.5, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('contractor_seed_roof_1', 'Solar & Toiture Verte (illustrative)', ARRAY['roofing', 'solar_pv']::TEXT[], 'Quebec', 4.3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "green_contractor_reviews" ("id", "contractor_id", "rating", "body", "author_label", "created_at")
VALUES
  ('rev_seed_1', 'contractor_seed_hp_1', 5, 'Installation soignée, suivi clair.', 'Homeowner — Laval', CURRENT_TIMESTAMP),
  ('rev_seed_2', 'contractor_seed_env_1', 4.5, 'Bon travail sur isolation grenier.', 'Seller — Montréal', CURRENT_TIMESTAMP);
