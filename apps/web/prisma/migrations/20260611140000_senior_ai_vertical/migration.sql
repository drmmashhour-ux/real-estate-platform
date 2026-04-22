-- CreateTable
CREATE TABLE "senior_ai_profiles" (
    "id" TEXT NOT NULL,
    "session_id" VARCHAR(64),
    "user_id" VARCHAR(36),
    "who_for" VARCHAR(16),
    "age_band" VARCHAR(24),
    "mobility_level" VARCHAR(40),
    "care_need_level" VARCHAR(24),
    "memory_support_needed" BOOLEAN NOT NULL DEFAULT false,
    "medical_support_needed" BOOLEAN NOT NULL DEFAULT false,
    "meal_support_needed" BOOLEAN NOT NULL DEFAULT false,
    "social_activity_priority" BOOLEAN NOT NULL DEFAULT false,
    "budget_band" VARCHAR(16),
    "preferred_city" VARCHAR(160),
    "preferred_area" VARCHAR(160),
    "language_preference" VARCHAR(8),
    "urgency_level" VARCHAR(16),
    "profile_confidence" DOUBLE PRECISION,
    "inferred_fields_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "senior_ai_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senior_ai_matching_results" (
    "id" TEXT NOT NULL,
    "profile_id" VARCHAR(36) NOT NULL,
    "residence_id" VARCHAR(36) NOT NULL,
    "base_match_score" DOUBLE PRECISION NOT NULL,
    "ranking_score" DOUBLE PRECISION,
    "final_score" DOUBLE PRECISION NOT NULL,
    "explanation_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "senior_ai_matching_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senior_ai_lead_scores" (
    "id" TEXT NOT NULL,
    "lead_id" VARCHAR(36) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "band" VARCHAR(16) NOT NULL,
    "explanation_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "senior_ai_lead_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senior_ai_operator_performance" (
    "id" TEXT NOT NULL,
    "residence_id" VARCHAR(36) NOT NULL,
    "response_time_avg" DOUBLE PRECISION,
    "lead_acceptance_rate" DOUBLE PRECISION,
    "visit_rate" DOUBLE PRECISION,
    "conversion_rate" DOUBLE PRECISION,
    "profile_completeness" DOUBLE PRECISION,
    "trust_score" DOUBLE PRECISION,
    "operator_score" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "senior_ai_operator_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senior_ai_pricing_rules" (
    "id" TEXT NOT NULL,
    "city" VARCHAR(160),
    "lead_base_price" DOUBLE PRECISION NOT NULL,
    "min_price" DOUBLE PRECISION NOT NULL,
    "max_price" DOUBLE PRECISION NOT NULL,
    "demand_factor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "quality_factor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "senior_ai_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senior_ai_learning_events" (
    "id" TEXT NOT NULL,
    "profile_id" VARCHAR(36),
    "residence_id" VARCHAR(36),
    "lead_id" VARCHAR(36),
    "event_type" VARCHAR(32) NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "senior_ai_learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senior_ai_area_insights" (
    "id" TEXT NOT NULL,
    "city" VARCHAR(160) NOT NULL,
    "area_label" VARCHAR(256) NOT NULL,
    "area_score" DOUBLE PRECISION NOT NULL,
    "active_residences" INTEGER NOT NULL,
    "average_conversion_rate" DOUBLE PRECISION,
    "average_match_score" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "senior_ai_area_insights_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "senior_ai_profiles_user_id_idx" ON "senior_ai_profiles"("user_id");
CREATE INDEX "senior_ai_profiles_session_id_idx" ON "senior_ai_profiles"("session_id");

CREATE INDEX "senior_ai_matching_results_profile_id_final_score_idx" ON "senior_ai_matching_results"("profile_id", "final_score" DESC);
CREATE INDEX "senior_ai_matching_results_residence_id_created_at_idx" ON "senior_ai_matching_results"("residence_id", "created_at" DESC);

CREATE INDEX "senior_ai_lead_scores_lead_id_created_at_idx" ON "senior_ai_lead_scores"("lead_id", "created_at" DESC);
CREATE INDEX "senior_ai_lead_scores_band_created_at_idx" ON "senior_ai_lead_scores"("band", "created_at");

CREATE UNIQUE INDEX "senior_ai_operator_performance_residence_id_key" ON "senior_ai_operator_performance"("residence_id");

CREATE INDEX "senior_ai_pricing_rules_city_idx" ON "senior_ai_pricing_rules"("city");

CREATE INDEX "senior_ai_learning_events_event_type_created_at_idx" ON "senior_ai_learning_events"("event_type", "created_at");
CREATE INDEX "senior_ai_learning_events_created_at_idx" ON "senior_ai_learning_events"("created_at");

CREATE UNIQUE INDEX "senior_ai_area_insights_city_area_label_key" ON "senior_ai_area_insights"("city", "area_label");
CREATE INDEX "senior_ai_area_insights_city_area_score_idx" ON "senior_ai_area_insights"("city", "area_score" DESC);

ALTER TABLE "senior_ai_profiles" ADD CONSTRAINT "senior_ai_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "senior_ai_matching_results" ADD CONSTRAINT "senior_ai_matching_results_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "senior_ai_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "senior_ai_matching_results" ADD CONSTRAINT "senior_ai_matching_results_residence_id_fkey" FOREIGN KEY ("residence_id") REFERENCES "senior_residences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "senior_ai_lead_scores" ADD CONSTRAINT "senior_ai_lead_scores_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "senior_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "senior_ai_operator_performance" ADD CONSTRAINT "senior_ai_operator_performance_residence_id_fkey" FOREIGN KEY ("residence_id") REFERENCES "senior_residences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
