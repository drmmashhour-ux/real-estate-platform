-- Safe listing supply pipeline (permission-based intake; no scraping).

CREATE TYPE "listing_acquisition_source_type" AS ENUM ('OWNER', 'BROKER', 'HOST', 'MANUAL');

CREATE TYPE "listing_acquisition_permission_status" AS ENUM ('UNKNOWN', 'REQUESTED', 'GRANTED', 'REJECTED');

CREATE TYPE "listing_acquisition_intake_status" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'AWAITING_ASSETS', 'READY_FOR_REVIEW', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "fsbo_listings" ADD COLUMN "supply_publication_stage" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN "permission_confirmed_at" TIMESTAMP(3),
ADD COLUMN "permission_source_note" TEXT,
ADD COLUMN "rewritten_description_reviewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "images_approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "image_source_note" TEXT,
ADD COLUMN "missing_approved_images" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "fsbo_listings_supply_publication_stage_idx" ON "fsbo_listings"("supply_publication_stage");

ALTER TABLE "bnhub_listings" ADD COLUMN "permission_confirmed_at" TIMESTAMP(3),
ADD COLUMN "permission_source_note" TEXT,
ADD COLUMN "images_approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "image_source_note" TEXT,
ADD COLUMN "missing_approved_images" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "listing_acquisition_leads" (
    "id" TEXT NOT NULL,
    "source_type" "listing_acquisition_source_type" NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "city" TEXT NOT NULL,
    "property_category" TEXT NOT NULL,
    "source_platform_text" TEXT,
    "permission_status" "listing_acquisition_permission_status" NOT NULL DEFAULT 'UNKNOWN',
    "intake_status" "listing_acquisition_intake_status" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "assigned_to_user_id" TEXT,
    "price_cents" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "description" TEXT,
    "amenities_text" TEXT,
    "permission_confirmed_at" TIMESTAMP(3),
    "submitted_image_urls" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "linked_fsbo_listing_id" TEXT,
    "linked_short_term_listing_id" TEXT,
    "linked_crm_listing_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_acquisition_leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_acquisition_leads_linked_fsbo_listing_id_key" ON "listing_acquisition_leads"("linked_fsbo_listing_id");

CREATE UNIQUE INDEX "listing_acquisition_leads_linked_short_term_listing_id_key" ON "listing_acquisition_leads"("linked_short_term_listing_id");

CREATE UNIQUE INDEX "listing_acquisition_leads_linked_crm_listing_id_key" ON "listing_acquisition_leads"("linked_crm_listing_id");

CREATE INDEX "listing_acquisition_leads_intake_status_idx" ON "listing_acquisition_leads"("intake_status");

CREATE INDEX "listing_acquisition_leads_permission_status_idx" ON "listing_acquisition_leads"("permission_status");

CREATE INDEX "listing_acquisition_leads_city_idx" ON "listing_acquisition_leads"("city");

CREATE INDEX "listing_acquisition_leads_source_type_idx" ON "listing_acquisition_leads"("source_type");

CREATE INDEX "listing_acquisition_leads_created_at_idx" ON "listing_acquisition_leads"("created_at");

ALTER TABLE "listing_acquisition_leads" ADD CONSTRAINT "listing_acquisition_leads_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "listing_acquisition_leads" ADD CONSTRAINT "listing_acquisition_leads_linked_fsbo_listing_id_fkey" FOREIGN KEY ("linked_fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "listing_acquisition_leads" ADD CONSTRAINT "listing_acquisition_leads_linked_short_term_listing_id_fkey" FOREIGN KEY ("linked_short_term_listing_id") REFERENCES "bnhub_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "listing_acquisition_leads" ADD CONSTRAINT "listing_acquisition_leads_linked_crm_listing_id_fkey" FOREIGN KEY ("linked_crm_listing_id") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
