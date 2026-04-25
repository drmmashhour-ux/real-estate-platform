-- Québec closing: fund-flow milestones + pre-closing identity attestation

ALTER TABLE "lecipm_deal_closings" ADD COLUMN "pre_closing_identities_verified_at" TIMESTAMP(3);
ALTER TABLE "lecipm_deal_closings" ADD COLUMN "pre_closing_identities_verified_by_id" VARCHAR(36);

CREATE TABLE "deal_closing_fund_milestones" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    "amount_cents" INTEGER,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'CAD',
    "expected_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_closing_fund_milestones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_closing_fund_milestones_deal_id_kind_key" ON "deal_closing_fund_milestones"("deal_id", "kind");
CREATE INDEX "deal_closing_fund_milestones_deal_id_idx" ON "deal_closing_fund_milestones"("deal_id");

ALTER TABLE "deal_closing_fund_milestones" ADD CONSTRAINT "deal_closing_fund_milestones_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
