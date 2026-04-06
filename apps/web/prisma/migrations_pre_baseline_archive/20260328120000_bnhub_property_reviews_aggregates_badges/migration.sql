-- BNHub hotel-grade reviews: extra dimensions on Review + aggregates + host performance + badges.

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "accuracy_rating" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "check_in_rating" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "moderation_held" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "spam_score" DOUBLE PRECISION;

CREATE TABLE "property_rating_aggregates" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "avg_rating" DOUBLE PRECISION NOT NULL,
    "total_reviews" INTEGER NOT NULL,
    "cleanliness_avg" DOUBLE PRECISION NOT NULL,
    "accuracy_avg" DOUBLE PRECISION NOT NULL,
    "communication_avg" DOUBLE PRECISION NOT NULL,
    "location_avg" DOUBLE PRECISION NOT NULL,
    "value_avg" DOUBLE PRECISION NOT NULL,
    "checkin_avg" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_rating_aggregates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_rating_aggregates_listing_id_key" ON "property_rating_aggregates"("listing_id");

ALTER TABLE "property_rating_aggregates" ADD CONSTRAINT "property_rating_aggregates_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "bnhub_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "host_performance" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "response_rate" DOUBLE PRECISION NOT NULL,
    "avg_response_time" DOUBLE PRECISION NOT NULL,
    "cancellation_rate" DOUBLE PRECISION NOT NULL,
    "completion_rate" DOUBLE PRECISION NOT NULL,
    "dispute_rate" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "host_performance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "host_performance_host_id_key" ON "host_performance"("host_id");

ALTER TABLE "host_performance" ADD CONSTRAINT "host_performance_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "host_badges" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "badge_type" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_badges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "host_badges_host_id_idx" ON "host_badges"("host_id");

CREATE UNIQUE INDEX "host_badges_host_id_badge_type_key" ON "host_badges"("host_id", "badge_type");

ALTER TABLE "host_badges" ADD CONSTRAINT "host_badges_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
