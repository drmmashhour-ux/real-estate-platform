-- AlterTable
ALTER TABLE "mortgage_brokers" ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "mortgage_brokers" ADD COLUMN "total_reviews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mortgage_brokers" ADD COLUMN "response_time_avg" DOUBLE PRECISION;
ALTER TABLE "mortgage_brokers" ADD COLUMN "response_time_samples" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "mortgage_brokers" ADD COLUMN "total_leads_handled" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "mortgage_requests" ADD COLUMN "assigned_at" TIMESTAMP(3);
ALTER TABLE "mortgage_requests" ADD COLUMN "performance_stats_recorded" BOOLEAN NOT NULL DEFAULT false;

UPDATE "mortgage_requests"
SET "assigned_at" = "created_at"
WHERE "broker_id" IS NOT NULL AND "assigned_at" IS NULL;

-- CreateTable
CREATE TABLE "broker_reviews" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "mortgage_request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "broker_reviews_mortgage_request_id_key" ON "broker_reviews"("mortgage_request_id");

CREATE INDEX "broker_reviews_broker_id_idx" ON "broker_reviews"("broker_id");

CREATE INDEX "broker_reviews_user_id_idx" ON "broker_reviews"("user_id");

ALTER TABLE "broker_reviews" ADD CONSTRAINT "broker_reviews_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "mortgage_brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_reviews" ADD CONSTRAINT "broker_reviews_mortgage_request_id_fkey" FOREIGN KEY ("mortgage_request_id") REFERENCES "mortgage_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_reviews" ADD CONSTRAINT "broker_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
