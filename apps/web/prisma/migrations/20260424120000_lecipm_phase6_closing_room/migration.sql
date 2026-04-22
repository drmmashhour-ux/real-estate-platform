-- Phase 6: closing room, documents, checklist, portfolio assets, transaction archive
CREATE TABLE "lecipm_pipeline_deal_closings" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "transaction_id" VARCHAR(36),
    "closing_status" VARCHAR(24) NOT NULL DEFAULT 'PREPARING',
    "closing_date" TIMESTAMP(3),
    "closing_location" VARCHAR(512),
    "notary_name" VARCHAR(256),
    "notary_email" VARCHAR(320),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lecipm_pipeline_deal_closings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_pipeline_deal_closings_deal_id_key" ON "lecipm_pipeline_deal_closings"("deal_id");
CREATE UNIQUE INDEX "lecipm_pipeline_deal_closings_transaction_id_key" ON "lecipm_pipeline_deal_closings"("transaction_id");

ALTER TABLE "lecipm_pipeline_deal_closings"
  ADD CONSTRAINT "lecipm_pipeline_deal_closings_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_pipeline_deal_closings"
  ADD CONSTRAINT "lecipm_pipeline_deal_closings_transaction_id_fkey"
  FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_pipeline_deal_closing_documents" (
    "id" TEXT NOT NULL,
    "closing_id" VARCHAR(36) NOT NULL,
    "transaction_document_id" VARCHAR(36),
    "title" VARCHAR(512) NOT NULL,
    "doc_type" VARCHAR(32) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_pipeline_deal_closing_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_pipeline_deal_closing_documents_closing_id_idx" ON "lecipm_pipeline_deal_closing_documents"("closing_id");

ALTER TABLE "lecipm_pipeline_deal_closing_documents"
  ADD CONSTRAINT "lecipm_pipeline_deal_closing_documents_closing_id_fkey"
  FOREIGN KEY ("closing_id") REFERENCES "lecipm_pipeline_deal_closings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_pipeline_deal_closing_documents"
  ADD CONSTRAINT "lecipm_pipeline_deal_closing_documents_transaction_document_id_fkey"
  FOREIGN KEY ("transaction_document_id") REFERENCES "lecipm_sd_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_pipeline_deal_closing_checklist_items" (
    "id" TEXT NOT NULL,
    "closing_id" VARCHAR(36) NOT NULL,
    "label" VARCHAR(512) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "is_critical" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "lecipm_pipeline_deal_closing_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_pipeline_deal_closing_checklist_items_closing_id_idx" ON "lecipm_pipeline_deal_closing_checklist_items"("closing_id");

ALTER TABLE "lecipm_pipeline_deal_closing_checklist_items"
  ADD CONSTRAINT "lecipm_pipeline_deal_closing_checklist_items_closing_id_fkey"
  FOREIGN KEY ("closing_id") REFERENCES "lecipm_pipeline_deal_closings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_portfolio_assets" (
    "id" TEXT NOT NULL,
    "deal_id" VARCHAR(36) NOT NULL,
    "transaction_id" VARCHAR(36),
    "asset_name" VARCHAR(512) NOT NULL,
    "property_id" VARCHAR(36),
    "acquisition_price" DOUBLE PRECISION NOT NULL,
    "acquisition_date" TIMESTAMP(3) NOT NULL,
    "ownership_type" VARCHAR(64),
    "strategy_type" VARCHAR(64),
    "status" VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_portfolio_assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_portfolio_assets_deal_id_idx" ON "lecipm_portfolio_assets"("deal_id");
CREATE INDEX "lecipm_portfolio_assets_property_id_idx" ON "lecipm_portfolio_assets"("property_id");

ALTER TABLE "lecipm_portfolio_assets"
  ADD CONSTRAINT "lecipm_portfolio_assets_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "lecipm_pipeline_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lecipm_portfolio_assets"
  ADD CONSTRAINT "lecipm_portfolio_assets_transaction_id_fkey"
  FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_portfolio_assets"
  ADD CONSTRAINT "lecipm_portfolio_assets_property_id_fkey"
  FOREIGN KEY ("property_id") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_portfolio_asset_documents" (
    "id" TEXT NOT NULL,
    "asset_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "file_url" TEXT,
    "doc_type" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_portfolio_asset_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_portfolio_asset_documents_asset_id_idx" ON "lecipm_portfolio_asset_documents"("asset_id");

ALTER TABLE "lecipm_portfolio_asset_documents"
  ADD CONSTRAINT "lecipm_portfolio_asset_documents_asset_id_fkey"
  FOREIGN KEY ("asset_id") REFERENCES "lecipm_portfolio_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_sd_transaction_archives" (
    "id" TEXT NOT NULL,
    "transaction_id" VARCHAR(36) NOT NULL,
    "archive_status" VARCHAR(24) NOT NULL DEFAULT 'CREATED',
    "snapshot_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lecipm_sd_transaction_archives_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_sd_transaction_archives_transaction_id_key" ON "lecipm_sd_transaction_archives"("transaction_id");

ALTER TABLE "lecipm_sd_transaction_archives"
  ADD CONSTRAINT "lecipm_sd_transaction_archives_transaction_id_fkey"
  FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
