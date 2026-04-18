-- Manual ad spend rows for CPL (additive; growth ops input only)
CREATE TABLE "growth_ops_manual_ad_spend" (
    "id" TEXT NOT NULL,
    "utm_campaign" VARCHAR(256) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "spend_cents" INTEGER NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'CAD',
    "note" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_ops_manual_ad_spend_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "growth_ops_manual_ad_spend_utm_campaign_idx" ON "growth_ops_manual_ad_spend"("utm_campaign");
CREATE INDEX "growth_ops_manual_ad_spend_period_start_period_end_idx" ON "growth_ops_manual_ad_spend"("period_start", "period_end");
