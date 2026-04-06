ALTER TABLE "fsbo_listings"
ADD COLUMN "expires_at" TIMESTAMP(3),
ADD COLUMN "expiry_reminder_sent_at" TIMESTAMP(3),
ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE INDEX "fsbo_listings_expires_at_idx" ON "fsbo_listings"("expires_at");
CREATE INDEX "fsbo_listings_archived_at_idx" ON "fsbo_listings"("archived_at");
