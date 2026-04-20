-- LECIPM broker FARCIQ insurance + compliance layer (advisory; not legal advice)

CREATE TABLE "broker_insurances" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "policy_number" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'FARCIQ',
    "coverage_per_loss" INTEGER NOT NULL DEFAULT 2000000,
    "coverage_per_year" INTEGER NOT NULL DEFAULT 2000000,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(24) NOT NULL,
    "deductible_level" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_insurances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_insurance_claims" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "private_file_id" TEXT,
    "status" VARCHAR(24) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_insurance_claims_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_compliance_events" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "type" VARCHAR(24) NOT NULL,
    "message" TEXT NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_compliance_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "broker_insurances_broker_id_status_idx" ON "broker_insurances"("broker_id", "status");
CREATE INDEX "broker_insurances_broker_id_end_date_idx" ON "broker_insurances"("broker_id", "end_date");

CREATE INDEX "broker_insurance_claims_broker_id_created_at_idx" ON "broker_insurance_claims"("broker_id", "created_at");

CREATE INDEX "broker_compliance_events_broker_id_created_at_idx" ON "broker_compliance_events"("broker_id", "created_at");

ALTER TABLE "broker_insurances" ADD CONSTRAINT "broker_insurances_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_insurance_claims" ADD CONSTRAINT "broker_insurance_claims_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_compliance_events" ADD CONSTRAINT "broker_compliance_events_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
