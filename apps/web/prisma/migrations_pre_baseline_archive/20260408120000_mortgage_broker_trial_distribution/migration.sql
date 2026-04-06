-- Trial / subscription, fair distribution, pay-per-lead, distribution logs
ALTER TABLE "mortgage_brokers" ADD COLUMN "trial_ends_at" TIMESTAMP(3);
ALTER TABLE "mortgage_brokers" ADD COLUMN "is_primary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mortgage_brokers" ADD COLUMN "last_assigned_lead_at" TIMESTAMP(3);
ALTER TABLE "mortgage_brokers" ADD COLUMN "priority_score" INTEGER NOT NULL DEFAULT 0;

UPDATE "mortgage_brokers" SET "plan" = 'trial' WHERE "plan" = 'free';
UPDATE "mortgage_brokers" SET "trial_ends_at" = NOW() + interval '7 days' WHERE "plan" = 'trial' AND "trial_ends_at" IS NULL;

UPDATE "mortgage_brokers" SET "is_primary" = true
WHERE "id" = (
  SELECT "id" FROM "mortgage_brokers" ORDER BY "created_at" ASC LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM "mortgage_brokers" b2 WHERE b2."is_primary" = true);

ALTER TABLE "mortgage_requests" ADD COLUMN "is_purchased_lead" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "mortgage_lead_distribution_logs" (
    "id" TEXT NOT NULL,
    "mortgage_request_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_lead_distribution_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mortgage_lead_distribution_logs_broker_id_idx" ON "mortgage_lead_distribution_logs"("broker_id");
CREATE INDEX "mortgage_lead_distribution_logs_created_at_idx" ON "mortgage_lead_distribution_logs"("created_at");

ALTER TABLE "mortgage_lead_distribution_logs" ADD CONSTRAINT "mortgage_lead_distribution_logs_mortgage_request_id_fkey" FOREIGN KEY ("mortgage_request_id") REFERENCES "mortgage_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mortgage_lead_distribution_logs" ADD CONSTRAINT "mortgage_lead_distribution_logs_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "mortgage_brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "mortgage_brokers_is_primary_idx" ON "mortgage_brokers"("is_primary");
CREATE INDEX "mortgage_brokers_last_assigned_lead_at_idx" ON "mortgage_brokers"("last_assigned_lead_at");
