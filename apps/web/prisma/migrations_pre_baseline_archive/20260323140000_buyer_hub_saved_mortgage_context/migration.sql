-- BuyerHub: saved listings + mortgage request listing context

CREATE TABLE IF NOT EXISTS "buyer_saved_listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fsbo_listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_saved_listings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "buyer_saved_listings_user_id_fsbo_listing_id_key" ON "buyer_saved_listings"("user_id", "fsbo_listing_id");
CREATE INDEX IF NOT EXISTS "buyer_saved_listings_user_id_idx" ON "buyer_saved_listings"("user_id");

DO $$ BEGIN
 ALTER TABLE "buyer_saved_listings" ADD CONSTRAINT "buyer_saved_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "buyer_saved_listings" ADD CONSTRAINT "buyer_saved_listings_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "mortgage_requests" ADD COLUMN IF NOT EXISTS "fsbo_listing_id" TEXT;
ALTER TABLE "mortgage_requests" ADD COLUMN IF NOT EXISTS "employment_status" TEXT;
ALTER TABLE "mortgage_requests" ADD COLUMN IF NOT EXISTS "credit_range" TEXT;

CREATE INDEX IF NOT EXISTS "mortgage_requests_fsbo_listing_id_idx" ON "mortgage_requests"("fsbo_listing_id");

DO $$ BEGIN
 ALTER TABLE "mortgage_requests" ADD CONSTRAINT "mortgage_requests_fsbo_listing_id_fkey" FOREIGN KEY ("fsbo_listing_id") REFERENCES "fsbo_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
