-- Broker CRM: clients, interactions, listing links

CREATE TYPE "BrokerClientStatus" AS ENUM (
  'LEAD',
  'CONTACTED',
  'QUALIFIED',
  'VIEWING',
  'NEGOTIATING',
  'UNDER_CONTRACT',
  'CLOSED',
  'LOST'
);

CREATE TYPE "BrokerInteractionType" AS ENUM (
  'NOTE',
  'EMAIL',
  'CALL',
  'MEETING',
  'TASK',
  'FOLLOW_UP',
  'STATUS_CHANGE'
);

CREATE TYPE "BrokerClientListingKind" AS ENUM (
  'SAVED',
  'SHARED',
  'VIEWED',
  'FAVORITE'
);

CREATE TABLE "broker_clients" (
    "id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "user_id" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "BrokerClientStatus" NOT NULL DEFAULT 'LEAD',
    "source" TEXT,
    "budget_min" DOUBLE PRECISION,
    "budget_max" DOUBLE PRECISION,
    "target_city" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_client_interactions" (
    "id" TEXT NOT NULL,
    "broker_client_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "type" "BrokerInteractionType" NOT NULL,
    "title" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_client_interactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broker_client_listings" (
    "id" TEXT NOT NULL,
    "broker_client_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "kind" "BrokerClientListingKind" NOT NULL DEFAULT 'SAVED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "broker_client_listings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "broker_clients" ADD CONSTRAINT "broker_clients_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_clients" ADD CONSTRAINT "broker_clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_client_interactions" ADD CONSTRAINT "broker_client_interactions_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "broker_client_interactions" ADD CONSTRAINT "broker_client_interactions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "broker_client_listings" ADD CONSTRAINT "broker_client_listings_broker_client_id_fkey" FOREIGN KEY ("broker_client_id") REFERENCES "broker_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "broker_client_listings_broker_client_id_listing_id_key" ON "broker_client_listings"("broker_client_id", "listing_id");

CREATE INDEX "broker_clients_broker_id_idx" ON "broker_clients"("broker_id");
CREATE INDEX "broker_clients_user_id_idx" ON "broker_clients"("user_id");
CREATE INDEX "broker_clients_status_idx" ON "broker_clients"("status");

CREATE INDEX "broker_client_interactions_broker_client_id_idx" ON "broker_client_interactions"("broker_client_id");
CREATE INDEX "broker_client_interactions_due_at_idx" ON "broker_client_interactions"("due_at");

CREATE INDEX "broker_client_listings_broker_client_id_idx" ON "broker_client_listings"("broker_client_id");
CREATE INDEX "broker_client_listings_listing_id_idx" ON "broker_client_listings"("listing_id");
