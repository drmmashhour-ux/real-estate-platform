-- Listing offer workflow (buyer ↔ broker) + audit events

CREATE TYPE "OfferStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'COUNTERED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED'
);

CREATE TYPE "OfferEventType" AS ENUM (
  'CREATED',
  'SUBMITTED',
  'STATUS_CHANGED',
  'COUNTERED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'NOTE_ADDED'
);

CREATE TABLE "listing_offers" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "broker_id" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "offered_price" DOUBLE PRECISION NOT NULL,
    "down_payment_amount" DOUBLE PRECISION,
    "financing_needed" BOOLEAN,
    "closing_date" TIMESTAMP(3),
    "conditions" TEXT,
    "message" TEXT,
    "scenario" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_offer_events" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "type" "OfferEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_offer_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "listing_offers" ADD CONSTRAINT "listing_offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "listing_offers" ADD CONSTRAINT "listing_offers_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "listing_offer_events" ADD CONSTRAINT "listing_offer_events_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "listing_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "listing_offer_events" ADD CONSTRAINT "listing_offer_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "listing_offers_listing_id_idx" ON "listing_offers"("listing_id");
CREATE INDEX "listing_offers_buyer_id_idx" ON "listing_offers"("buyer_id");
CREATE INDEX "listing_offers_broker_id_idx" ON "listing_offers"("broker_id");
CREATE INDEX "listing_offers_status_idx" ON "listing_offers"("status");
CREATE INDEX "listing_offer_events_offer_id_idx" ON "listing_offer_events"("offer_id");
