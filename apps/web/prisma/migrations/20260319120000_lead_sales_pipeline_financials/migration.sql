-- Lead sales / closing fields
ALTER TABLE "Lead" ADD COLUMN "pipeline_stage" TEXT NOT NULL DEFAULT 'new';
ALTER TABLE "Lead" ADD COLUMN "deal_value" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "commission_estimate" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "last_contacted_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "next_action_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "meeting_at" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "meeting_completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lead" ADD COLUMN "final_sale_price" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "final_commission" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "deal_closed_at" TIMESTAMP(3);

UPDATE "Lead" SET "pipeline_stage" = "pipeline_status";

CREATE INDEX "Lead_pipeline_stage_idx" ON "Lead"("pipeline_stage");
CREATE INDEX "Lead_deal_value_idx" ON "Lead"("deal_value");
CREATE INDEX "Lead_next_action_at_idx" ON "Lead"("next_action_at");
