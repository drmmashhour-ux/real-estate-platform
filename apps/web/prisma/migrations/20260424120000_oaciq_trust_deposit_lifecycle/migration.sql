-- OACIQ trust account profiles + deposit lifecycle (events) + expand trust_deposits

CREATE TABLE "trust_account_profiles" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "trust_account_enabled" BOOLEAN NOT NULL DEFAULT false,
    "institution_name" TEXT,
    "masked_account_ref" TEXT,
    "account_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_account_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_trust_account_profile_owner" ON "trust_account_profiles"("owner_type", "owner_id");
CREATE INDEX "idx_trust_account_profile_owner_id" ON "trust_account_profiles"("owner_id");

CREATE TABLE "trust_deposit_events" (
    "id" TEXT NOT NULL,
    "trust_deposit_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "performed_by_id" TEXT,
    "ai_assisted" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_deposit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_trust_deposit_events_deposit" ON "trust_deposit_events"("trust_deposit_id");
CREATE INDEX "idx_trust_deposit_events_type" ON "trust_deposit_events"("event_type");

ALTER TABLE "trust_deposit_events" ADD CONSTRAINT "trust_deposit_events_trust_deposit_id_fkey" FOREIGN KEY ("trust_deposit_id") REFERENCES "trust_deposits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "offer_id" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "contract_id" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "payer_user_id" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "trust_account_profile_id" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "deposit_type" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "context_type" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'CAD';
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "external_reference" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "release_rule_type" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "release_rule_text" TEXT;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "received_at" TIMESTAMP(3);
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "held_at" TIMESTAMP(3);
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "released_at" TIMESTAMP(3);
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "refunded_at" TIMESTAMP(3);
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "requires_manual_review" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "compliance_flags" JSONB;
ALTER TABLE "trust_deposits" ADD COLUMN IF NOT EXISTS "notes" TEXT;

UPDATE "trust_deposits" SET "deposit_type" = 'other_trust_funds' WHERE "deposit_type" IS NULL;
UPDATE "trust_deposits" SET "context_type" = 'other' WHERE "context_type" IS NULL;

ALTER TABLE "trust_deposits" ALTER COLUMN "deposit_type" SET NOT NULL;
ALTER TABLE "trust_deposits" ALTER COLUMN "context_type" SET NOT NULL;

ALTER TABLE "trust_deposits" ALTER COLUMN "status" SET DEFAULT 'pending_receipt';

ALTER TABLE "trust_deposits" ADD CONSTRAINT "trust_deposits_trust_account_profile_id_fkey" FOREIGN KEY ("trust_account_profile_id") REFERENCES "trust_account_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "idx_trust_deposits_offer" ON "trust_deposits"("offer_id");
CREATE INDEX IF NOT EXISTS "idx_trust_deposits_contract" ON "trust_deposits"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_trust_deposits_profile" ON "trust_deposits"("trust_account_profile_id");
CREATE INDEX IF NOT EXISTS "idx_trust_deposits_status" ON "trust_deposits"("status");
