-- S1 anti-fraud: phone verification, listing reports, review queue
ALTER TABLE "syria_users" ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "syria_phone_otp" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "syria_phone_otp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "syria_phone_otp_user_id_idx" ON "syria_phone_otp"("user_id");
CREATE INDEX IF NOT EXISTS "syria_phone_otp_expires_at_idx" ON "syria_phone_otp"("expires_at");
ALTER TABLE "syria_phone_otp" ADD CONSTRAINT "syria_phone_otp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "syria_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "syria_properties" ADD COLUMN IF NOT EXISTS "needs_review" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "syria_listing_reports" (
  "id" TEXT NOT NULL,
  "property_id" TEXT NOT NULL,
  "reporter_id" TEXT,
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "syria_listing_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "syria_listing_reports_property_id_idx" ON "syria_listing_reports"("property_id");
CREATE INDEX IF NOT EXISTS "syria_listing_reports_created_at_idx" ON "syria_listing_reports"("created_at");
ALTER TABLE "syria_listing_reports" ADD CONSTRAINT "syria_listing_reports_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "syria_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "syria_listing_reports" ADD CONSTRAINT "syria_listing_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "syria_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
