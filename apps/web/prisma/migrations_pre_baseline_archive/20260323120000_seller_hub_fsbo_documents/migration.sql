-- Seller Hub: profile address, listing extended fields, document slots

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "seller_profile_address" TEXT;

ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "cadastre_number" TEXT;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "year_built" INTEGER;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "annual_taxes_cents" INTEGER;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "condo_fees_cents" INTEGER;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "seller_declaration_json" JSONB;
ALTER TABLE "fsbo_listings" ADD COLUMN IF NOT EXISTS "seller_declaration_completed_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "fsbo_listing_documents" (
    "id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_url" TEXT,
    "file_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'missing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fsbo_listing_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fsbo_listing_documents_fsbo_listing_id_doc_type_key" ON "fsbo_listing_documents"("fsbo_listing_id", "doc_type");
CREATE INDEX IF NOT EXISTS "fsbo_listing_documents_fsbo_listing_id_idx" ON "fsbo_listing_documents"("fsbo_listing_id");

DO $$ BEGIN
 ALTER TABLE "fsbo_listing_documents" ADD CONSTRAINT "fsbo_listing_documents_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
