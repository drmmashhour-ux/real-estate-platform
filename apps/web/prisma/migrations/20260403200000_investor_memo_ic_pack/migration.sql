-- Investor memo / IC pack versioned artifacts (LECIPM internal decision support).

CREATE TABLE "investor_memos" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "generated_for_user_id" TEXT,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "title" TEXT NOT NULL,
    "memo_type" TEXT NOT NULL,
    "headline_decision" TEXT,
    "recommendation" TEXT,
    "confidence_level" TEXT,
    "payload_json" JSONB NOT NULL,
    "pdf_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_memos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investor_ic_packs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "generated_for_user_id" TEXT,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "title" TEXT NOT NULL,
    "decision_stage" TEXT,
    "recommendation" TEXT,
    "confidence_level" TEXT,
    "payload_json" JSONB NOT NULL,
    "pdf_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_ic_packs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investor_decision_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "memo_id" TEXT,
    "ic_pack_id" TEXT,
    "recommendation" TEXT,
    "confidence_level" TEXT,
    "rationale_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_decision_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "investor_memos_listing_id_created_at_idx" ON "investor_memos"("listing_id", "created_at" DESC);

CREATE INDEX "investor_ic_packs_listing_id_created_at_idx" ON "investor_ic_packs"("listing_id", "created_at" DESC);

CREATE INDEX "investor_decision_logs_listing_id_created_at_idx" ON "investor_decision_logs"("listing_id", "created_at" DESC);

ALTER TABLE "investor_memos" ADD CONSTRAINT "investor_memos_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investor_memos" ADD CONSTRAINT "investor_memos_generated_for_user_id_fkey" FOREIGN KEY ("generated_for_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investor_ic_packs" ADD CONSTRAINT "investor_ic_packs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investor_ic_packs" ADD CONSTRAINT "investor_ic_packs_generated_for_user_id_fkey" FOREIGN KEY ("generated_for_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investor_decision_logs" ADD CONSTRAINT "investor_decision_logs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "investor_decision_logs" ADD CONSTRAINT "investor_decision_logs_memo_id_fkey" FOREIGN KEY ("memo_id") REFERENCES "investor_memos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "investor_decision_logs" ADD CONSTRAINT "investor_decision_logs_ic_pack_id_fkey" FOREIGN KEY ("ic_pack_id") REFERENCES "investor_ic_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
