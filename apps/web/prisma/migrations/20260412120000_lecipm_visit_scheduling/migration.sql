-- LECIPM visit scheduling (broker availability, visit requests, confirmed visits)

CREATE TYPE "LecipmVisitRequestStatus" AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE "LecipmVisitStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

CREATE TABLE "lecipm_broker_availability" (
    "id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "time_zone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_broker_availability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_availability_broker_user_id_idx" ON "lecipm_broker_availability"("broker_user_id");

ALTER TABLE "lecipm_broker_availability" ADD CONSTRAINT "lecipm_broker_availability_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_broker_time_off" (
    "id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "start_date_time" TIMESTAMP(3) NOT NULL,
    "end_date_time" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_broker_time_off_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_broker_time_off_broker_user_id_idx" ON "lecipm_broker_time_off"("broker_user_id");
CREATE INDEX "lecipm_broker_time_off_range_idx" ON "lecipm_broker_time_off"("broker_user_id", "start_date_time", "end_date_time");

ALTER TABLE "lecipm_broker_time_off" ADD CONSTRAINT "lecipm_broker_time_off_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "lecipm_visit_requests" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "thread_id" TEXT,
    "listing_id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "customer_user_id" TEXT,
    "guest_name" TEXT,
    "guest_email" TEXT,
    "requested_start" TIMESTAMP(3) NOT NULL,
    "requested_end" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 45,
    "status" "LecipmVisitRequestStatus" NOT NULL DEFAULT 'pending',
    "broker_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_visit_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_visit_requests_broker_user_id_idx" ON "lecipm_visit_requests"("broker_user_id");
CREATE INDEX "lecipm_visit_requests_listing_id_idx" ON "lecipm_visit_requests"("listing_id");
CREATE INDEX "lecipm_visit_requests_lead_id_idx" ON "lecipm_visit_requests"("lead_id");
CREATE INDEX "lecipm_visit_requests_status_idx" ON "lecipm_visit_requests"("status");
CREATE INDEX "lecipm_visit_requests_thread_id_idx" ON "lecipm_visit_requests"("thread_id");

ALTER TABLE "lecipm_visit_requests" ADD CONSTRAINT "lecipm_visit_requests_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lecipm_broker_crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_visit_requests" ADD CONSTRAINT "lecipm_visit_requests_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_visit_requests" ADD CONSTRAINT "lecipm_visit_requests_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_visit_requests" ADD CONSTRAINT "lecipm_visit_requests_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lecipm_visit_requests" ADD CONSTRAINT "lecipm_visit_requests_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "lecipm_broker_listing_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lecipm_visits" (
    "id" TEXT NOT NULL,
    "visit_request_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "customer_user_id" TEXT,
    "start_date_time" TIMESTAMP(3) NOT NULL,
    "end_date_time" TIMESTAMP(3) NOT NULL,
    "status" "LecipmVisitStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_visits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_visits_visit_request_id_key" ON "lecipm_visits"("visit_request_id");

CREATE INDEX "lecipm_visits_broker_user_id_idx" ON "lecipm_visits"("broker_user_id");
CREATE INDEX "lecipm_visits_start_date_time_idx" ON "lecipm_visits"("start_date_time");
CREATE INDEX "lecipm_visits_lead_id_idx" ON "lecipm_visits"("lead_id");
CREATE INDEX "lecipm_visits_listing_id_idx" ON "lecipm_visits"("listing_id");

ALTER TABLE "lecipm_visits" ADD CONSTRAINT "lecipm_visits_visit_request_id_fkey" FOREIGN KEY ("visit_request_id") REFERENCES "lecipm_visit_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_visits" ADD CONSTRAINT "lecipm_visits_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lecipm_broker_crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_visits" ADD CONSTRAINT "lecipm_visits_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_visits" ADD CONSTRAINT "lecipm_visits_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lecipm_visits" ADD CONSTRAINT "lecipm_visits_customer_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
