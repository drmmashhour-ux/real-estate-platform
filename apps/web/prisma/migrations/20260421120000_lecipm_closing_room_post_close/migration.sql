-- Closing room + post-close asset onboarding (LECIPM execution bridge)

CREATE TABLE "lecipm_deal_closings" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'NOT_STARTED',
    "closing_date" TIMESTAMP(3),
    "confirmed_by_user_id" TEXT,
    "readiness_status" VARCHAR(24),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_deal_closings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_deal_closings_deal_id_key" ON "lecipm_deal_closings"("deal_id");

CREATE TABLE "lecipm_closing_room_documents" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "category" VARCHAR(24) NOT NULL,
    "file_url" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'MISSING',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "verified_by_user_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_closing_room_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_deal_closing_checklists" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "category" VARCHAR(24) NOT NULL,
    "priority" VARCHAR(16),
    "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    "owner_user_id" TEXT,
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_deal_closing_checklists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lecipm_deal_closing_signatures" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "document_id" TEXT,
    "signer_name" VARCHAR(256) NOT NULL,
    "signer_role" VARCHAR(64) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "signed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_deal_closing_signatures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "post_close_assets" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "asset_name" VARCHAR(512) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "acquisition_date" TIMESTAMP(3),
    "owner_entity" VARCHAR(512),
    "esg_profile_id" TEXT,
    "operations_initialized" BOOLEAN NOT NULL DEFAULT false,
    "revenue_initialized" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_metadata_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_close_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_close_assets_deal_id_key" ON "post_close_assets"("deal_id");

CREATE TABLE "deal_closing_audits" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "event_type" VARCHAR(48) NOT NULL,
    "note" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_closing_audits_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "lecipm_deal_closings" ADD CONSTRAINT "lecipm_deal_closings_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_deal_closings" ADD CONSTRAINT "lecipm_deal_closings_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_closing_room_documents" ADD CONSTRAINT "lecipm_closing_room_documents_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_closing_room_documents" ADD CONSTRAINT "lecipm_closing_room_documents_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_deal_closing_checklists" ADD CONSTRAINT "lecipm_deal_closing_checklists_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_deal_closing_checklists" ADD CONSTRAINT "lecipm_deal_closing_checklists_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_deal_closing_signatures" ADD CONSTRAINT "lecipm_deal_closing_signatures_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_deal_closing_signatures" ADD CONSTRAINT "lecipm_deal_closing_signatures_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "lecipm_closing_room_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "post_close_assets" ADD CONSTRAINT "post_close_assets_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_close_assets" ADD CONSTRAINT "post_close_assets_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "post_close_assets" ADD CONSTRAINT "post_close_assets_esg_profile_id_fkey" FOREIGN KEY ("esg_profile_id") REFERENCES "esg_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "deal_closing_audits" ADD CONSTRAINT "deal_closing_audits_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deal_closing_audits" ADD CONSTRAINT "deal_closing_audits_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "lecipm_closing_room_documents_deal_id_idx" ON "lecipm_closing_room_documents"("deal_id");
CREATE INDEX "lecipm_closing_room_documents_deal_id_status_idx" ON "lecipm_closing_room_documents"("deal_id", "status");
CREATE INDEX "lecipm_deal_closing_checklists_deal_id_idx" ON "lecipm_deal_closing_checklists"("deal_id");
CREATE INDEX "lecipm_deal_closing_checklists_deal_id_status_idx" ON "lecipm_deal_closing_checklists"("deal_id", "status");
CREATE INDEX "lecipm_deal_closing_signatures_deal_id_idx" ON "lecipm_deal_closing_signatures"("deal_id");
CREATE INDEX "post_close_assets_listing_id_idx" ON "post_close_assets"("listing_id");
CREATE INDEX "deal_closing_audits_deal_id_created_at_idx" ON "deal_closing_audits"("deal_id", "created_at");
