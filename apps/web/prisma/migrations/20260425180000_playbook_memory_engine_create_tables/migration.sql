-- Playbook Memory Engine — PostgreSQL DDL aligned with `MemoryPlaybook` / `PlaybookMemoryRecord` in `schema.prisma`
-- (CRM `Playbook` remains `conversion_playbooks` — separate tables.)

CREATE TYPE "MemoryDomain" AS ENUM (
  'GROWTH', 'PRICING', 'LEADS', 'DEALS', 'LISTINGS', 'MESSAGING', 'PROMOTIONS', 'BOOKINGS', 'BROKER_ROUTING', 'RISK'
);

CREATE TYPE "MemorySource" AS ENUM (
  'HUMAN', 'SYSTEM', 'AI_RECOMMENDATION', 'AI_AUTOMATION', 'IMPORTED'
);

CREATE TYPE "MemoryOutcomeStatus" AS ENUM (
  'PENDING', 'PARTIAL', 'SUCCEEDED', 'FAILED', 'NEUTRAL', 'CANCELLED'
);

CREATE TYPE "PlaybookStatus" AS ENUM (
  'DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'
);

CREATE TYPE "PlaybookExecutionMode" AS ENUM (
  'RECOMMEND_ONLY', 'HUMAN_APPROVAL', 'SAFE_AUTOPILOT', 'FULL_AUTOPILOT'
);

CREATE TYPE "PlaybookScoreBand" AS ENUM (
  'LOW', 'MEDIUM', 'HIGH', 'ELITE'
);

-- Parent table first; `current_version_id` FK added after `memory_playbook_versions` exists.
CREATE TABLE "memory_strategy_playbooks" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "domain" "MemoryDomain" NOT NULL,
    "status" "PlaybookStatus" NOT NULL DEFAULT 'DRAFT',
    "execution_mode" "PlaybookExecutionMode" NOT NULL DEFAULT 'RECOMMEND_ONLY',
    "owner_user_id" TEXT,
    "created_by_system" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "segment_scope" JSONB,
    "market_scope" JSONB,
    "constraints" JSONB,
    "objectives" JSONB,
    "success_criteria" JSONB,
    "stop_conditions" JSONB,
    "current_version_id" TEXT,
    "score_band" "PlaybookScoreBand" NOT NULL DEFAULT 'LOW',
    "total_executions" INTEGER NOT NULL DEFAULT 0,
    "successful_executions" INTEGER NOT NULL DEFAULT 0,
    "failed_executions" INTEGER NOT NULL DEFAULT 0,
    "avg_expected_value" DOUBLE PRECISION,
    "avg_realized_value" DOUBLE PRECISION,
    "avg_realized_revenue" DOUBLE PRECISION,
    "avg_conversion_lift" DOUBLE PRECISION,
    "avg_risk_score" DOUBLE PRECISION,
    "last_executed_at" TIMESTAMP(3),
    "last_promoted_at" TIMESTAMP(3),
    "last_demoted_at" TIMESTAMP(3),
    CONSTRAINT "memory_strategy_playbooks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "memory_strategy_playbooks_key_key" ON "memory_strategy_playbooks"("key");
CREATE UNIQUE INDEX "memory_strategy_playbooks_current_version_id_key" ON "memory_strategy_playbooks"("current_version_id");
CREATE INDEX "memory_strategy_playbooks_domain_status_idx" ON "memory_strategy_playbooks"("domain", "status");
CREATE INDEX "memory_strategy_playbooks_execution_mode_status_idx" ON "memory_strategy_playbooks"("execution_mode", "status");
CREATE INDEX "memory_strategy_playbooks_score_band_status_idx" ON "memory_strategy_playbooks"("score_band", "status");

CREATE TABLE "memory_playbook_versions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playbook_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT,
    "strategy_definition" JSONB NOT NULL,
    "retrieval_hints" JSONB,
    "action_template" JSONB,
    "policy_requirements" JSONB,
    "risk_limits" JSONB,
    "rollout_config" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "promoted_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "executions" INTEGER NOT NULL DEFAULT 0,
    "successes" INTEGER NOT NULL DEFAULT 0,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "avg_realized_value" DOUBLE PRECISION,
    "avg_revenue_lift" DOUBLE PRECISION,
    "avg_conversion_lift" DOUBLE PRECISION,
    "avg_risk_score" DOUBLE PRECISION,
    CONSTRAINT "memory_playbook_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "memory_playbook_versions_playbook_id_version_key" ON "memory_playbook_versions"("playbook_id", "version");
CREATE INDEX "memory_playbook_versions_playbook_id_is_active_idx" ON "memory_playbook_versions"("playbook_id", "is_active");

ALTER TABLE "memory_playbook_versions"
  ADD CONSTRAINT "memory_playbook_versions_playbook_id_fkey"
  FOREIGN KEY ("playbook_id") REFERENCES "memory_strategy_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memory_strategy_playbooks"
  ADD CONSTRAINT "memory_strategy_playbooks_current_version_id_fkey"
  FOREIGN KEY ("current_version_id") REFERENCES "memory_playbook_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "playbook_memory_records" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domain" "MemoryDomain" NOT NULL,
    "source" "MemorySource" NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_version" TEXT,
    "actor_user_id" TEXT,
    "actor_system" TEXT,
    "actor_role" TEXT,
    "listing_id" TEXT,
    "lead_id" TEXT,
    "deal_id" TEXT,
    "booking_id" TEXT,
    "broker_id" TEXT,
    "customer_id" TEXT,
    "memory_playbook_id" TEXT,
    "memory_playbook_version_id" TEXT,
    "correlation_key" TEXT,
    "idempotency_key" TEXT,
    "context_snapshot" JSONB NOT NULL,
    "action_payload" JSONB NOT NULL,
    "policy_snapshot" JSONB,
    "risk_snapshot" JSONB,
    "objective_snapshot" JSONB,
    "similarity_fingerprint" TEXT,
    "segment_key" TEXT,
    "market_key" TEXT,
    "initial_confidence" DOUBLE PRECISION,
    "safety_score" DOUBLE PRECISION,
    "expected_value" DOUBLE PRECISION,
    "outcome_status" "MemoryOutcomeStatus" NOT NULL DEFAULT 'PENDING',
    "outcome_summary" JSONB,
    "realized_value" DOUBLE PRECISION,
    "realized_revenue" DOUBLE PRECISION,
    "realized_conversion" DOUBLE PRECISION,
    "realized_latency_ms" INTEGER,
    "realized_risk_score" DOUBLE PRECISION,
    "outcome_evaluated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    CONSTRAINT "playbook_memory_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "playbook_memory_records_idempotency_key_key" ON "playbook_memory_records"("idempotency_key");
CREATE INDEX "playbook_memory_records_domain_created_at_idx" ON "playbook_memory_records"("domain", "created_at");
CREATE INDEX "playbook_memory_records_action_type_created_at_idx" ON "playbook_memory_records"("action_type", "created_at");
CREATE INDEX "playbook_memory_records_segment_key_created_at_idx" ON "playbook_memory_records"("segment_key", "created_at");
CREATE INDEX "playbook_memory_records_market_key_created_at_idx" ON "playbook_memory_records"("market_key", "created_at");
CREATE INDEX "playbook_memory_records_listing_id_idx" ON "playbook_memory_records"("listing_id");
CREATE INDEX "playbook_memory_records_lead_id_idx" ON "playbook_memory_records"("lead_id");
CREATE INDEX "playbook_memory_records_deal_id_idx" ON "playbook_memory_records"("deal_id");
CREATE INDEX "playbook_memory_records_booking_id_idx" ON "playbook_memory_records"("booking_id");
CREATE INDEX "playbook_memory_records_memory_playbook_id_created_at_idx" ON "playbook_memory_records"("memory_playbook_id", "created_at");
CREATE INDEX "playbook_memory_records_outcome_status_created_at_idx" ON "playbook_memory_records"("outcome_status", "created_at");
CREATE INDEX "playbook_memory_records_similarity_fingerprint_created_at_idx" ON "playbook_memory_records"("similarity_fingerprint", "created_at");

ALTER TABLE "playbook_memory_records"
  ADD CONSTRAINT "playbook_memory_records_memory_playbook_id_fkey"
  FOREIGN KEY ("memory_playbook_id") REFERENCES "memory_strategy_playbooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "playbook_memory_records"
  ADD CONSTRAINT "playbook_memory_records_memory_playbook_version_id_fkey"
  FOREIGN KEY ("memory_playbook_version_id") REFERENCES "memory_playbook_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "memory_playbook_outcome_metrics" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memory_record_id" TEXT NOT NULL,
    "metric_key" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION,
    "metric_text" TEXT,
    "metric_json" JSONB,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    CONSTRAINT "memory_playbook_outcome_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "memory_playbook_outcome_metrics_memory_record_id_observed_at_idx" ON "memory_playbook_outcome_metrics"("memory_record_id", "observed_at");
CREATE INDEX "memory_playbook_outcome_metrics_metric_key_observed_at_idx" ON "memory_playbook_outcome_metrics"("metric_key", "observed_at");

ALTER TABLE "memory_playbook_outcome_metrics"
  ADD CONSTRAINT "memory_playbook_outcome_metrics_memory_record_id_fkey"
  FOREIGN KEY ("memory_record_id") REFERENCES "playbook_memory_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "memory_playbook_retrieval_indexes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domain" "MemoryDomain" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "segment_key" TEXT,
    "market_key" TEXT,
    "fingerprint" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "memory_record_id" TEXT,
    "memory_playbook_id" TEXT,
    "score" DOUBLE PRECISION,
    CONSTRAINT "memory_playbook_retrieval_indexes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "memory_playbook_retrieval_indexes_domain_entity_type_created_at_idx" ON "memory_playbook_retrieval_indexes"("domain", "entity_type", "created_at");
CREATE INDEX "memory_playbook_retrieval_indexes_segment_key_market_key_idx" ON "memory_playbook_retrieval_indexes"("segment_key", "market_key");
CREATE INDEX "memory_playbook_retrieval_indexes_fingerprint_idx" ON "memory_playbook_retrieval_indexes"("fingerprint");
CREATE INDEX "memory_playbook_retrieval_indexes_memory_playbook_id_idx" ON "memory_playbook_retrieval_indexes"("memory_playbook_id");

ALTER TABLE "memory_playbook_retrieval_indexes"
  ADD CONSTRAINT "memory_playbook_retrieval_indexes_memory_record_id_fkey"
  FOREIGN KEY ("memory_record_id") REFERENCES "playbook_memory_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "memory_playbook_retrieval_indexes"
  ADD CONSTRAINT "memory_playbook_retrieval_indexes_memory_playbook_id_fkey"
  FOREIGN KEY ("memory_playbook_id") REFERENCES "memory_strategy_playbooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "memory_playbook_lifecycle_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playbook_id" TEXT NOT NULL,
    "playbook_version_id" TEXT,
    "event_type" TEXT NOT NULL,
    "reason" TEXT,
    "payload" JSONB,
    CONSTRAINT "memory_playbook_lifecycle_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "memory_playbook_lifecycle_events_playbook_id_created_at_idx" ON "memory_playbook_lifecycle_events"("playbook_id", "created_at");

ALTER TABLE "memory_playbook_lifecycle_events"
  ADD CONSTRAINT "memory_playbook_lifecycle_events_playbook_id_fkey"
  FOREIGN KEY ("playbook_id") REFERENCES "memory_strategy_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
