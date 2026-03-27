-- BNHub: fraud_checks, trust_scores, booking agreement snapshots, host/guest profiles, dispute evidence type.

CREATE TABLE "fraud_checks" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "check_type" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fraud_checks_listing_id_idx" ON "fraud_checks"("listing_id");
CREATE INDEX "fraud_checks_check_type_idx" ON "fraud_checks"("check_type");
CREATE INDEX "fraud_checks_result_idx" ON "fraud_checks"("result");

ALTER TABLE "fraud_checks" ADD CONSTRAINT "fraud_checks_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trust_scores" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "factors" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trust_scores_entity_type_entity_id_idx" ON "trust_scores"("entity_type", "entity_id");
CREATE INDEX "trust_scores_created_at_idx" ON "trust_scores"("created_at");

CREATE TABLE "bnhub_booking_agreements" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "document_url" TEXT,
    "content_markdown" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_booking_agreements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_booking_agreements_booking_id_idx" ON "bnhub_booking_agreements"("booking_id");

ALTER TABLE "bnhub_booking_agreements" ADD CONSTRAINT "bnhub_booking_agreements_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_host_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_host_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_host_profiles_user_id_key" ON "bnhub_host_profiles"("user_id");
CREATE INDEX "bnhub_host_profiles_trust_score_idx" ON "bnhub_host_profiles"("trust_score");

ALTER TABLE "bnhub_host_profiles" ADD CONSTRAINT "bnhub_host_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bnhub_guest_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "history" JSONB DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_guest_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bnhub_guest_profiles_user_id_key" ON "bnhub_guest_profiles"("user_id");
CREATE INDEX "bnhub_guest_profiles_trust_score_idx" ON "bnhub_guest_profiles"("trust_score");

ALTER TABLE "bnhub_guest_profiles" ADD CONSTRAINT "bnhub_guest_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dispute_evidence" ADD COLUMN IF NOT EXISTS "type" TEXT;
