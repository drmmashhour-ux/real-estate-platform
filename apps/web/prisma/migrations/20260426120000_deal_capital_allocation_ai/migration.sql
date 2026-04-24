-- Advisory deal-level capital allocation AI (broker approval required).

CREATE TABLE "deal_capital_allocations" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "recommended_amount_cents" INTEGER NOT NULL,
    "allocation_percent" DOUBLE PRECISION NOT NULL,
    "reasoning_json" JSONB NOT NULL,
    "confidence_score" INTEGER NOT NULL,
    "broker_approval_status" VARCHAR(16) NOT NULL DEFAULT 'PROPOSED',
    "proposed_by_user_id" TEXT,
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_capital_allocations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deal_capital_allocations_deal_id_created_at_idx" ON "deal_capital_allocations"("deal_id", "created_at" DESC);

CREATE INDEX "deal_capital_allocations_deal_id_broker_approval_status_idx" ON "deal_capital_allocations"("deal_id", "broker_approval_status");

ALTER TABLE "deal_capital_allocations" ADD CONSTRAINT "deal_capital_allocations_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deal_capital_allocations" ADD CONSTRAINT "deal_capital_allocations_proposed_by_user_id_fkey" FOREIGN KEY ("proposed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "deal_capital_allocations" ADD CONSTRAINT "deal_capital_allocations_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
