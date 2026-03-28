-- Phase 2: featured listings, broker plans, viral events, social queue

CREATE TABLE "featured_listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_type" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stripe_payment_intent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "featured_listings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "featured_listings_listing_type_listing_id_idx" ON "featured_listings"("listing_type", "listing_id");
CREATE INDEX "featured_listings_user_id_idx" ON "featured_listings"("user_id");
CREATE INDEX "featured_listings_active_ends_at_idx" ON "featured_listings"("active", "ends_at");

ALTER TABLE "featured_listings" ADD CONSTRAINT "featured_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "broker_plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_cents_monthly" INTEGER NOT NULL,
    "features_json" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "broker_plans_slug_key" ON "broker_plans"("slug");

CREATE TABLE "viral_growth_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viral_growth_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "viral_growth_events_event_type_created_at_idx" ON "viral_growth_events"("event_type", "created_at");
CREATE INDEX "viral_growth_events_user_id_idx" ON "viral_growth_events"("user_id");

ALTER TABLE "viral_growth_events" ADD CONSTRAINT "viral_growth_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "social_scheduled_posts" (
    "id" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "platform" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "posted_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_scheduled_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_scheduled_posts_status_scheduled_at_idx" ON "social_scheduled_posts"("status", "scheduled_at");
CREATE INDEX "social_scheduled_posts_platform_idx" ON "social_scheduled_posts"("platform");

ALTER TABLE "social_scheduled_posts" ADD CONSTRAINT "social_scheduled_posts_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
