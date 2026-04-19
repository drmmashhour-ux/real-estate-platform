-- Internal operator advisory overrides for lead pricing review (admin-only domain).
CREATE TABLE "lead_pricing_overrides" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "system_suggested_price" INTEGER NOT NULL,
    "override_price" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "cleared_at" TIMESTAMP(3),
    "cleared_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pricing_overrides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_pricing_overrides_lead_id_status_idx" ON "lead_pricing_overrides"("lead_id", "status");
CREATE INDEX "lead_pricing_overrides_lead_id_created_at_idx" ON "lead_pricing_overrides"("lead_id", "created_at");

ALTER TABLE "lead_pricing_overrides" ADD CONSTRAINT "lead_pricing_overrides_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_pricing_overrides" ADD CONSTRAINT "lead_pricing_overrides_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_pricing_overrides" ADD CONSTRAINT "lead_pricing_overrides_cleared_by_user_id_fkey" FOREIGN KEY ("cleared_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
