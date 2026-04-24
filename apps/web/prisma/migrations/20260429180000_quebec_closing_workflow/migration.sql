-- Québec closing workflow: stages, notary checklist rows, adjustments, condition waive/fail.

ALTER TABLE "deal_closing_conditions" ADD COLUMN "waived_at" TIMESTAMP(3),
ADD COLUMN "failed_at" TIMESTAMP(3);

ALTER TABLE "lecipm_deal_closings" ADD COLUMN "qc_closing_stage" VARCHAR(40),
ADD COLUMN "qc_workflow_started_at" TIMESTAMP(3),
ADD COLUMN "offer_accepted_at" TIMESTAMP(3),
ADD COLUMN "signing_scheduled_at" TIMESTAMP(3),
ADD COLUMN "deed_signed_at" TIMESTAMP(3),
ADD COLUMN "deed_act_number" VARCHAR(128),
ADD COLUMN "deed_publication_reference" TEXT,
ADD COLUMN "land_register_status" VARCHAR(24),
ADD COLUMN "land_register_confirmed_at" TIMESTAMP(3),
ADD COLUMN "keys_released_at" TIMESTAMP(3),
ADD COLUMN "closing_packet_marked_complete_at" TIMESTAMP(3),
ADD COLUMN "closing_packet_complete_by_user_id" TEXT;

ALTER TABLE "deal_notary_coordinations" ADD COLUMN "notary_display_name" VARCHAR(256),
ADD COLUMN "notary_office" VARCHAR(512),
ADD COLUMN "notary_email" VARCHAR(320),
ADD COLUMN "notary_phone" VARCHAR(64),
ADD COLUMN "requested_documents_json" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE "deal_quebec_notary_checklist_items" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "item_key" VARCHAR(64) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_quebec_notary_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_quebec_notary_checklist_items_deal_id_item_key_key" ON "deal_quebec_notary_checklist_items"("deal_id", "item_key");
CREATE INDEX "deal_quebec_notary_checklist_items_deal_id_idx" ON "deal_quebec_notary_checklist_items"("deal_id");

ALTER TABLE "deal_quebec_notary_checklist_items" ADD CONSTRAINT "deal_quebec_notary_checklist_items_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "deal_closing_adjustments" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "label" VARCHAR(512) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "buyer_owes" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_closing_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_closing_adjustments_deal_id_idx" ON "deal_closing_adjustments"("deal_id");

ALTER TABLE "deal_closing_adjustments" ADD CONSTRAINT "deal_closing_adjustments_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
