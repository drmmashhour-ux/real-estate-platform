-- LECIPM — Québec co-ownership (Reg. 2025) checklist on broker CRM Listing

CREATE TYPE "LecipmListingAssetType" AS ENUM ('HOUSE', 'CONDO', 'MULTI_UNIT', 'TOWNHOUSE', 'LAND', 'OTHER');

CREATE TYPE "ComplianceChecklistItemStatus" AS ENUM ('PENDING', 'COMPLETED');

ALTER TABLE "Listing" ADD COLUMN "listing_type" "LecipmListingAssetType" NOT NULL DEFAULT 'HOUSE';
ALTER TABLE "Listing" ADD COLUMN "is_co_ownership" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "listing_coownership_checklist_items" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "ComplianceChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_coownership_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_checklist_item_listing_key" ON "listing_coownership_checklist_items"("listing_id", "key");

CREATE INDEX "idx_checklist_item_listing_id" ON "listing_coownership_checklist_items"("listing_id");

ALTER TABLE "listing_coownership_checklist_items" ADD CONSTRAINT "listing_coownership_checklist_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
