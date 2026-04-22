-- Phase 1: Centris-style broker transaction file — one SD number per deal folder.

CREATE TABLE "lecipm_transaction_sd_sequences" (
    "year" INTEGER NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lecipm_transaction_sd_sequences_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "lecipm_transactions" (
    "id" TEXT NOT NULL,
    "transaction_number" VARCHAR(48) NOT NULL,
    "listing_id" VARCHAR(36),
    "property_id" VARCHAR(36),
    "broker_id" VARCHAR(36) NOT NULL,
    "transaction_type" VARCHAR(32) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(512),
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lecipm_transactions_transaction_number_key" ON "lecipm_transactions"("transaction_number");
CREATE INDEX "lecipm_transactions_broker_id_status_idx" ON "lecipm_transactions"("broker_id", "status");
CREATE INDEX "lecipm_transactions_broker_id_updated_at_idx" ON "lecipm_transactions"("broker_id", "updated_at" DESC);
CREATE INDEX "lecipm_transactions_listing_id_idx" ON "lecipm_transactions"("listing_id");
CREATE INDEX "lecipm_transactions_transaction_number_idx" ON "lecipm_transactions"("transaction_number");

CREATE TABLE "lecipm_transaction_parties" (
    "id" TEXT NOT NULL,
    "transaction_id" VARCHAR(36) NOT NULL,
    "role" VARCHAR(24) NOT NULL,
    "display_name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_transaction_parties_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_transaction_parties_transaction_id_idx" ON "lecipm_transaction_parties"("transaction_id");

CREATE TABLE "lecipm_transaction_events" (
    "id" TEXT NOT NULL,
    "transaction_id" VARCHAR(36) NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_transaction_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lecipm_transaction_events_transaction_id_created_at_idx" ON "lecipm_transaction_events"("transaction_id", "created_at");

ALTER TABLE "lecipm_transactions"
    ADD CONSTRAINT "lecipm_transactions_listing_id_fkey"
    FOREIGN KEY ("listing_id") REFERENCES "Listing" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_transactions"
    ADD CONSTRAINT "lecipm_transactions_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lecipm_transactions"
    ADD CONSTRAINT "lecipm_transactions_broker_id_fkey"
    FOREIGN KEY ("broker_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lecipm_transaction_parties"
    ADD CONSTRAINT "lecipm_transaction_parties_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecipm_transaction_events"
    ADD CONSTRAINT "lecipm_transaction_events_transaction_id_fkey"
    FOREIGN KEY ("transaction_id") REFERENCES "lecipm_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
