-- ORDER SYBNB-99 — ownership / mandate declarations for high-value real-estate listings.
ALTER TABLE "syria_properties" ADD COLUMN "owner_name" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN "owner_phone" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN "is_owner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "syria_properties" ADD COLUMN "has_mandate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "syria_properties" ADD COLUMN "mandate_document_url" TEXT;
ALTER TABLE "syria_properties" ADD COLUMN "ownership_verified" BOOLEAN NOT NULL DEFAULT false;
