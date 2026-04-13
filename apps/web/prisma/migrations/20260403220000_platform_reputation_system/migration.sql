-- Platform reputation (distinct from BNHub `Review` booking reviews).

CREATE TYPE "ReputationEntityType" AS ENUM ('host', 'broker', 'seller', 'listing', 'buyer');
CREATE TYPE "ReputationLevel" AS ENUM ('poor', 'fair', 'good', 'excellent');
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'published', 'hidden', 'flagged');
CREATE TYPE "ComplaintStatus" AS ENUM ('open', 'under_review', 'confirmed', 'dismissed', 'resolved');

CREATE TABLE "reputation_scores" (
    "id" UUID NOT NULL,
    "entity_type" "ReputationEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "level" "ReputationLevel" NOT NULL DEFAULT 'fair',
    "review_score" INTEGER NOT NULL DEFAULT 0,
    "reliability_score" INTEGER NOT NULL DEFAULT 0,
    "responsiveness_score" INTEGER NOT NULL DEFAULT 0,
    "complaint_score" INTEGER NOT NULL DEFAULT 0,
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "reasons_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reputation_scores_entity_type_entity_id_key" ON "reputation_scores"("entity_type", "entity_id");
CREATE INDEX "reputation_scores_level_idx" ON "reputation_scores"("level");

CREATE TABLE "reputation_reviews" (
    "id" UUID NOT NULL,
    "listing_id" TEXT,
    "subject_entity_type" "ReputationEntityType" NOT NULL,
    "subject_entity_id" TEXT NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reputation_reviews_author_user_id_subject_entity_type_subject_e_key" ON "reputation_reviews"("author_user_id", "subject_entity_type", "subject_entity_id");
CREATE INDEX "reputation_reviews_listing_id_idx" ON "reputation_reviews"("listing_id");
CREATE INDEX "reputation_reviews_subject_entity_type_subject_entity_id_idx" ON "reputation_reviews"("subject_entity_type", "subject_entity_id");
CREATE INDEX "reputation_reviews_author_user_id_idx" ON "reputation_reviews"("author_user_id");
CREATE INDEX "reputation_reviews_status_idx" ON "reputation_reviews"("status");

ALTER TABLE "reputation_reviews" ADD CONSTRAINT "reputation_reviews_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "reputation_complaints" (
    "id" UUID NOT NULL,
    "entity_type" "ReputationEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "reported_by_user_id" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_complaints_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reputation_complaints_entity_type_entity_id_idx" ON "reputation_complaints"("entity_type", "entity_id");
CREATE INDEX "reputation_complaints_status_idx" ON "reputation_complaints"("status");

ALTER TABLE "reputation_complaints" ADD CONSTRAINT "reputation_complaints_reported_by_user_id_fkey" FOREIGN KEY ("reported_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "reputation_response_metrics" (
    "id" UUID NOT NULL,
    "entity_type" "ReputationEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "avg_response_minutes" INTEGER,
    "reply_rate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_response_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reputation_response_metrics_entity_type_entity_id_key" ON "reputation_response_metrics"("entity_type", "entity_id");
