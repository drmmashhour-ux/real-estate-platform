-- Québec auto-offer draft (AI assistive; broker approval + sign before send)

CREATE TABLE "offer_drafts" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "buyer_id" TEXT NOT NULL,
    "generated_by" VARCHAR(16) NOT NULL DEFAULT 'AI',
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "deposit_amount" DOUBLE PRECISION,
    "financing_deadline" TIMESTAMP(3),
    "inspection_deadline" TIMESTAMP(3),
    "occupancy_date" TIMESTAMP(3),
    "included_items_json" JSONB NOT NULL DEFAULT '[]',
    "excluded_items_json" JSONB NOT NULL DEFAULT '[]',
    "special_conditions_json" JSONB NOT NULL DEFAULT '[]',
    "rationale_json" JSONB NOT NULL,
    "price_bands_json" JSONB,
    "clause_warnings_json" JSONB NOT NULL DEFAULT '[]',
    "financing_clause_text" TEXT,
    "inspection_clause_text" TEXT,
    "occupancy_clause_text" TEXT,
    "promise_artifact_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by_broker_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "sent_by_broker_id" TEXT,
    "offer_snapshot_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_drafts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "offer_drafts_promise_artifact_id_key" ON "offer_drafts"("promise_artifact_id");
CREATE INDEX "offer_drafts_deal_id_created_at_idx" ON "offer_drafts"("deal_id", "created_at" DESC);
CREATE INDEX "offer_drafts_deal_id_status_idx" ON "offer_drafts"("deal_id", "status");

ALTER TABLE "offer_drafts" ADD CONSTRAINT "offer_drafts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_drafts" ADD CONSTRAINT "offer_drafts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offer_drafts" ADD CONSTRAINT "offer_drafts_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "offer_drafts" ADD CONSTRAINT "offer_drafts_promise_artifact_id_fkey" FOREIGN KEY ("promise_artifact_id") REFERENCES "lecipm_legal_document_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offer_drafts" ADD CONSTRAINT "offer_drafts_approved_by_broker_id_fkey" FOREIGN KEY ("approved_by_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "offer_drafts" ADD CONSTRAINT "offer_drafts_sent_by_broker_id_fkey" FOREIGN KEY ("sent_by_broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "offer_draft_audit_logs" (
    "id" TEXT NOT NULL,
    "offer_draft_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" VARCHAR(48) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_draft_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "offer_draft_audit_logs_deal_id_created_at_idx" ON "offer_draft_audit_logs"("deal_id", "created_at");
CREATE INDEX "offer_draft_audit_logs_offer_draft_id_idx" ON "offer_draft_audit_logs"("offer_draft_id");
CREATE INDEX "offer_draft_audit_logs_action_idx" ON "offer_draft_audit_logs"("action");

ALTER TABLE "offer_draft_audit_logs" ADD CONSTRAINT "offer_draft_audit_logs_offer_draft_id_fkey" FOREIGN KEY ("offer_draft_id") REFERENCES "offer_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_draft_audit_logs" ADD CONSTRAINT "offer_draft_audit_logs_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_draft_audit_logs" ADD CONSTRAINT "offer_draft_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
