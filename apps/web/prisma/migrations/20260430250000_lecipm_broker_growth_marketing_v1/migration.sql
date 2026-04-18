-- CreateEnum
CREATE TYPE "listing_marketing_content_status" AS ENUM ('draft', 'ready_for_review', 'approved', 'rejected', 'scheduled', 'published', 'archived');

-- CreateEnum
CREATE TYPE "listing_marketing_draft_channel" AS ENUM ('email', 'sms_short', 'social_post', 'listing_page', 'ad_copy', 'internal_brief');

-- CreateTable
CREATE TABLE "listing_marketing_drafts" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "draft_type" VARCHAR(64) NOT NULL,
    "channel" "listing_marketing_draft_channel" NOT NULL,
    "title" VARCHAR(500),
    "subject" VARCHAR(500),
    "body" TEXT NOT NULL,
    "status" "listing_marketing_content_status" NOT NULL DEFAULT 'draft',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_marketing_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_marketing_suggestions" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "suggestion_type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "listing_marketing_content_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_marketing_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_growth_goals" (
    "id" TEXT NOT NULL,
    "broker_user_id" TEXT NOT NULL,
    "monthly_lead_target" INTEGER,
    "monthly_closing_target" INTEGER,
    "response_time_hours_target" DOUBLE PRECISION,
    "listing_conversion_rate_target" DOUBLE PRECISION,
    "follow_up_discipline_target" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_growth_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_marketing_drafts_listing_id_broker_id_idx" ON "listing_marketing_drafts"("listing_id", "broker_id");

-- CreateIndex
CREATE INDEX "listing_marketing_drafts_broker_id_status_idx" ON "listing_marketing_drafts"("broker_id", "status");

-- CreateIndex
CREATE INDEX "listing_marketing_suggestions_listing_id_broker_id_idx" ON "listing_marketing_suggestions"("listing_id", "broker_id");

-- CreateIndex
CREATE UNIQUE INDEX "broker_growth_goals_broker_user_id_key" ON "broker_growth_goals"("broker_user_id");

-- AddForeignKey
ALTER TABLE "listing_marketing_drafts" ADD CONSTRAINT "listing_marketing_drafts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_marketing_drafts" ADD CONSTRAINT "listing_marketing_drafts_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_marketing_suggestions" ADD CONSTRAINT "listing_marketing_suggestions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "fsbo_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_marketing_suggestions" ADD CONSTRAINT "listing_marketing_suggestions_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_growth_goals" ADD CONSTRAINT "broker_growth_goals_broker_user_id_fkey" FOREIGN KEY ("broker_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
