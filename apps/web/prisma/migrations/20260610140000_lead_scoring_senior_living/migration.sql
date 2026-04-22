-- Lead scoring (senior living) + feature snapshots + tunable weights

CREATE TABLE "lead_scores" (
    "id" TEXT NOT NULL,
    "lead_id" VARCHAR(36) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "band" VARCHAR(16) NOT NULL,
    "explanation_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_feature_snapshots" (
    "id" TEXT NOT NULL,
    "lead_id" VARCHAR(36) NOT NULL,
    "time_on_platform" DOUBLE PRECISION,
    "pages_viewed" INTEGER,
    "interactions" INTEGER,
    "budget_match" DOUBLE PRECISION,
    "care_match" DOUBLE PRECISION,
    "device_type" VARCHAR(32),
    "source" VARCHAR(160),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_feature_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_scoring_weights" (
    "id" TEXT NOT NULL,
    "w_engagement" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "w_budget" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "w_care" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "w_intent" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "w_source" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lead_scoring_weights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_scores_lead_id_created_at_idx" ON "lead_scores"("lead_id", "created_at" DESC);

CREATE INDEX "lead_scores_band_created_at_idx" ON "lead_scores"("band", "created_at");

CREATE INDEX "lead_feature_snapshots_lead_id_created_at_idx" ON "lead_feature_snapshots"("lead_id", "created_at" DESC);

ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "senior_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_feature_snapshots" ADD CONSTRAINT "lead_feature_snapshots_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "senior_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
