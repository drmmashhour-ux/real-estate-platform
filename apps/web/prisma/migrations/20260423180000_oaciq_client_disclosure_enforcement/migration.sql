-- OACIQ client disclosure profiles + acknowledgments (transaction-scoped)

CREATE TYPE "OaciqClientDisclosureFlow" AS ENUM ('OFFER_SUBMIT', 'CONTRACT_SIGN', 'AGREEMENT');

CREATE TABLE "oaciq_transaction_disclosure_profiles" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "broker_status_body" TEXT NOT NULL,
    "conflict_body" TEXT NOT NULL,
    "financial_interest_body" TEXT NOT NULL,
    "has_broker_conflict" BOOLEAN NOT NULL DEFAULT false,
    "has_broker_financial_interest" BOOLEAN NOT NULL DEFAULT false,
    "bundle_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oaciq_transaction_disclosure_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oaciq_transaction_disclosure_profiles_transaction_id_key" ON "oaciq_transaction_disclosure_profiles"("transaction_id");

CREATE TABLE "oaciq_client_disclosure_acks" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "flow" "OaciqClientDisclosureFlow" NOT NULL,
    "ack_text_exact" VARCHAR(512) NOT NULL,
    "disclosure_bundle_version" INTEGER NOT NULL,
    "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_ip" VARCHAR(128),
    "user_agent" VARCHAR(512),

    CONSTRAINT "oaciq_client_disclosure_acks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oaciq_client_disclosure_acks_transaction_id_user_id_flow_idx" ON "oaciq_client_disclosure_acks"("transaction_id", "user_id", "flow");
CREATE INDEX "oaciq_client_disclosure_acks_acknowledged_at_idx" ON "oaciq_client_disclosure_acks"("acknowledged_at");

ALTER TABLE "oaciq_transaction_disclosure_profiles" ADD CONSTRAINT "oaciq_transaction_disclosure_profiles_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "oaciq_client_disclosure_acks" ADD CONSTRAINT "oaciq_client_disclosure_acks_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "real_estate_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "oaciq_client_disclosure_acks" ADD CONSTRAINT "oaciq_client_disclosure_acks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
