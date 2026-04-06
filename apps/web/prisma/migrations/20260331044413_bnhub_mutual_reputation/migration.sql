-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "ai_composite_score" DOUBLE PRECISION,
ADD COLUMN     "ai_summary" TEXT,
ADD COLUMN     "amenities_as_advertised" BOOLEAN,
ADD COLUMN     "stay_checklist_json" JSONB;

-- AlterTable
ALTER TABLE "bnhub_listings" ADD COLUMN     "reputation_rank_boost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "bnhub_host_reviews_of_guest" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "guest_respect_rating" INTEGER NOT NULL,
    "property_care_rating" INTEGER,
    "checkout_compliance_rating" INTEGER,
    "quiet_hours_respected" BOOLEAN,
    "house_rules_respected" BOOLEAN,
    "theft_or_damage_reported" BOOLEAN NOT NULL DEFAULT false,
    "incident_details" TEXT,
    "host_notes" TEXT,
    "host_checklist_json" JSONB,
    "ai_composite_score" DOUBLE PRECISION,
    "ai_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bnhub_host_reviews_of_guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnhub_monthly_reputation_snapshots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_year_month" VARCHAR(7) NOT NULL,
    "role" VARCHAR(16) NOT NULL,
    "city" VARCHAR(128) NOT NULL DEFAULT '',
    "median_score" DOUBLE PRECISION NOT NULL,
    "sample_count" INTEGER NOT NULL,
    "rank_in_scope" INTEGER,
    "top_performer" BOOLEAN NOT NULL DEFAULT false,
    "perks_json" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_monthly_reputation_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_host_reviews_of_guest_booking_id_key" ON "bnhub_host_reviews_of_guest"("booking_id");

-- CreateIndex
CREATE INDEX "bnhub_host_reviews_of_guest_guest_id_idx" ON "bnhub_host_reviews_of_guest"("guest_id");

-- CreateIndex
CREATE INDEX "bnhub_host_reviews_of_guest_host_id_idx" ON "bnhub_host_reviews_of_guest"("host_id");

-- CreateIndex
CREATE INDEX "bnhub_host_reviews_of_guest_listing_id_idx" ON "bnhub_host_reviews_of_guest"("listing_id");

-- CreateIndex
CREATE INDEX "bnhub_monthly_reputation_snapshots_period_year_month_role_t_idx" ON "bnhub_monthly_reputation_snapshots"("period_year_month", "role", "top_performer");

-- CreateIndex
CREATE UNIQUE INDEX "bnhub_monthly_reputation_snapshots_user_id_period_year_mont_key" ON "bnhub_monthly_reputation_snapshots"("user_id", "period_year_month", "role", "city");

-- AddForeignKey
ALTER TABLE "bnhub_host_reviews_of_guest" ADD CONSTRAINT "bnhub_host_reviews_of_guest_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_host_reviews_of_guest" ADD CONSTRAINT "bnhub_host_reviews_of_guest_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_host_reviews_of_guest" ADD CONSTRAINT "bnhub_host_reviews_of_guest_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_host_reviews_of_guest" ADD CONSTRAINT "bnhub_host_reviews_of_guest_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnhub_monthly_reputation_snapshots" ADD CONSTRAINT "bnhub_monthly_reputation_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
