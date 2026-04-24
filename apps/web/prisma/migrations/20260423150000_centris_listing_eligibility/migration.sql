-- Centris eligibility (broker profile) + listing publication state for manual export workflow.
-- LECIPM does not call Centris APIs from this migration.

CREATE TYPE "LecipmListingCentrisPublicationState" AS ENUM ('DRAFT', 'READY_FOR_CENTRIS', 'PUBLISHED_INTERNAL', 'PUBLISHED_CENTRIS');

ALTER TABLE "lecipm_broker_licence_profiles" ADD COLUMN "has_centris_access" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lecipm_broker_licence_profiles" ADD COLUMN "centris_member_id" VARCHAR(64);

ALTER TABLE "Listing" ADD COLUMN "centris_publication_state" "LecipmListingCentrisPublicationState" NOT NULL DEFAULT 'DRAFT';

UPDATE "Listing" SET "centris_publication_state" = 'PUBLISHED_INTERNAL' WHERE "crm_marketplace_live" = true;
