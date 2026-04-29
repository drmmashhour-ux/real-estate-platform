-- Listing contact lead purchases (Stripe checkout holds contact reveal access).

DO $$ BEGIN
  CREATE TYPE "listing_contact_target_kind" AS ENUM ('FSBO_LISTING', 'CRM_LISTING');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "listing_contact_lead_purchases" (
    "id" TEXT NOT NULL,
    "buyer_user_id" TEXT NOT NULL,
    "target_kind" "listing_contact_target_kind" NOT NULL,
    "target_listing_id" TEXT NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'locked',
    "price_cents" INTEGER NOT NULL,
    "stripe_checkout_session_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_contact_lead_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "listing_contact_lead_purchases_stripe_checkout_session_id_key" ON "listing_contact_lead_purchases"("stripe_checkout_session_id");

CREATE UNIQUE INDEX IF NOT EXISTS "listing_contact_lead_purchase_unique_buyer_target" ON "listing_contact_lead_purchases"("buyer_user_id", "target_kind", "target_listing_id");

CREATE INDEX IF NOT EXISTS "listing_contact_lead_purchases_buyer_user_id_idx" ON "listing_contact_lead_purchases"("buyer_user_id");

CREATE INDEX IF NOT EXISTS "listing_contact_lead_purchases_target_listing_id_idx" ON "listing_contact_lead_purchases"("target_listing_id");

DO $$ BEGIN
  ALTER TABLE "listing_contact_lead_purchases" ADD CONSTRAINT "listing_contact_lead_purchases_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
