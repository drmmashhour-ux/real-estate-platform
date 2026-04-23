CREATE TABLE "complaint_cases" (
    "id" TEXT NOT NULL,
    "case_number" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "complainant_user_id" TEXT,
    "complainant_name" TEXT,
    "complainant_email" TEXT,
    "complainant_phone" TEXT,
    "target_type" TEXT,
    "target_id" TEXT,
    "linked_broker_id" TEXT,
    "linked_agency_id" TEXT,
    "linked_listing_id" TEXT,
    "linked_deal_id" TEXT,
    "linked_offer_id" TEXT,
    "linked_contract_id" TEXT,
    "complaint_channel" TEXT NOT NULL,
    "complaint_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "intake_language" TEXT,
    "status" TEXT NOT NULL,
    "routing_decision" TEXT,
    "ai_summary" TEXT,
    "ai_flags" JSONB,
    "first_received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_cases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "complaint_cases_case_number_key" ON "complaint_cases"("case_number");
CREATE INDEX "idx_complaint_case_owner" ON "complaint_cases"("owner_type", "owner_id");
CREATE INDEX "idx_complaint_case_status" ON "complaint_cases"("status");
CREATE INDEX "idx_complaint_case_type" ON "complaint_cases"("complaint_type");
CREATE INDEX "idx_complaint_case_linked_broker" ON "complaint_cases"("linked_broker_id");

CREATE TABLE "complaint_events" (
    "id" TEXT NOT NULL,
    "complaint_case_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "performed_by_id" TEXT,
    "ai_assisted" BOOLEAN NOT NULL DEFAULT false,
    "visible_to_complainant" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_complaint_events_case" ON "complaint_events"("complaint_case_id");
CREATE INDEX "idx_complaint_events_type" ON "complaint_events"("event_type");

ALTER TABLE "complaint_events" ADD CONSTRAINT "complaint_events_complaint_case_id_fkey" FOREIGN KEY ("complaint_case_id") REFERENCES "complaint_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "complaint_attachments" (
    "id" TEXT NOT NULL,
    "complaint_case_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "uploaded_by_id" TEXT,
    "confidential" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_complaint_attachments_case" ON "complaint_attachments"("complaint_case_id");

ALTER TABLE "complaint_attachments" ADD CONSTRAINT "complaint_attachments_complaint_case_id_fkey" FOREIGN KEY ("complaint_case_id") REFERENCES "complaint_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public_protection_referrals" (
    "id" TEXT NOT NULL,
    "complaint_case_id" TEXT NOT NULL,
    "referral_type" TEXT NOT NULL,
    "referral_status" TEXT NOT NULL,
    "referral_reason" TEXT NOT NULL,
    "referred_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_protection_referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "public_protection_referrals_complaint_case_id_key" ON "public_protection_referrals"("complaint_case_id");
CREATE INDEX "idx_public_protection_referral_type" ON "public_protection_referrals"("referral_type");

ALTER TABLE "public_protection_referrals" ADD CONSTRAINT "public_protection_referrals_complaint_case_id_fkey" FOREIGN KEY ("complaint_case_id") REFERENCES "complaint_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "complaint_policy_rules" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "complaint_type" TEXT NOT NULL,
    "default_severity" TEXT NOT NULL,
    "suggested_routing" TEXT NOT NULL,
    "auto_flag_syndic" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_policy_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_complaint_policy_owner" ON "complaint_policy_rules"("owner_type", "owner_id");
