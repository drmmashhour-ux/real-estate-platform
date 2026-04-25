-- Bounded self-evolution: proposals, experiments, events, policy. No legal/finance/compliance self-modification in product code.

CREATE TYPE "EvolutionProposalCategory" AS ENUM (
  'PLAYBOOK',
  'ROUTING_WEIGHT',
  'RANKING_WEIGHT',
  'HANDOFF_RULE',
  'FOLLOWUP_TIMING',
  'THRESHOLD',
  'FEATURE_SUBSET',
  'OTHER'
);
CREATE TYPE "EvolutionTargetScopeType" AS ENUM ('GLOBAL', 'MARKET', 'DOMAIN', 'BROKERAGE', 'SEGMENT');
CREATE TYPE "EvolutionProposalStatus" AS ENUM (
  'DRAFT',
  'SANDBOXED',
  'READY_FOR_REVIEW',
  'APPROVED',
  'REJECTED',
  'PROMOTED',
  'ROLLED_BACK'
);
CREATE TYPE "EvolutionAuthorKind" AS ENUM ('SYSTEM', 'HUMAN');
CREATE TYPE "EvolutionRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "EvolutionExperimentType" AS ENUM ('SHADOW', 'SANDBOX', 'LIMITED_TRAFFIC');
CREATE TYPE "EvolutionExperimentStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'STOPPED');
CREATE TYPE "EvolutionEventDecision" AS ENUM ('PROMOTED', 'REJECTED', 'ROLLED_BACK');
CREATE TYPE "EvolutionEventActor" AS ENUM ('SYSTEM', 'HUMAN');
CREATE TYPE "EvolutionPolicyScopeType" AS ENUM ('GLOBAL', 'DOMAIN');

CREATE TABLE "self_evolution_policies" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "scope_type" "EvolutionPolicyScopeType" NOT NULL,
    "scope_key" VARCHAR(256) NOT NULL,
    "allowed_self_promotion_categories_json" JSONB NOT NULL,
    "approval_required_categories_json" JSONB NOT NULL,
    "blocked_categories_json" JSONB NOT NULL,
    "max_auto_promote_risk_level" "EvolutionRiskLevel",
    "min_evidence_threshold_json" JSONB NOT NULL,
    "rollback_threshold_json" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "self_evolution_policies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "self_evolution_policies_is_active_scope_type_scope_key_idx" ON "self_evolution_policies"("is_active", "scope_type", "scope_key");

INSERT INTO "self_evolution_policies" (
  "id",
  "created_at",
  "updated_at",
  "scope_type",
  "scope_key",
  "allowed_self_promotion_categories_json",
  "approval_required_categories_json",
  "blocked_categories_json",
  "max_auto_promote_risk_level",
  "min_evidence_threshold_json",
  "rollback_threshold_json",
  "is_active"
) VALUES (
  'cui_self_evolution_default_global',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'GLOBAL',
  'global',
  '["ROUTING_WEIGHT","RANKING_WEIGHT","THRESHOLD"]'::jsonb,
  '["PLAYBOOK","HANDOFF_RULE","FEATURE_SUBSET","FOLLOWUP_TIMING","OTHER"]'::jsonb,
  '["COMPLIANCE","LEGAL","FINANCIAL_APPROVAL","AUTONOMY","EXTERNAL_MESSAGING","BROKER_MANDATORY","REGULATORY"]'::jsonb,
  'LOW',
  '{"minSampleSize":30,"minConfidence":0.55}'::jsonb,
  '{"maxDegradationVsBaseline":0.12}'::jsonb,
  true
);

CREATE TABLE "self_evolution_proposals" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category" "EvolutionProposalCategory" NOT NULL,
    "target_scope_type" "EvolutionTargetScopeType" NOT NULL,
    "target_scope_key" VARCHAR(256) NOT NULL,
    "current_version_key" VARCHAR(256) NOT NULL,
    "proposed_version_key" VARCHAR(256) NOT NULL,
    "proposal_json" JSONB NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "expected_impact_json" JSONB NOT NULL,
    "risk_level" "EvolutionRiskLevel" NOT NULL,
    "status" "EvolutionProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "generated_by" "EvolutionAuthorKind" NOT NULL,
    "approved_by_user_id" TEXT,
    "promoted_at" TIMESTAMP(3),
    "rolled_back_at" TIMESTAMP(3),
    CONSTRAINT "self_evolution_proposals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "self_evolution_proposals_status_risk_level_created_at_idx" ON "self_evolution_proposals"("status", "risk_level", "created_at");
CREATE INDEX "self_evolution_proposals_category_status_idx" ON "self_evolution_proposals"("category", "status");
CREATE INDEX "self_evolution_proposals_approved_by_user_id_idx" ON "self_evolution_proposals"("approved_by_user_id");
ALTER TABLE "self_evolution_proposals" ADD CONSTRAINT "self_evolution_proposals_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "self_evolution_experiments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "experiment_type" "EvolutionExperimentType" NOT NULL,
    "baseline_version_key" VARCHAR(256) NOT NULL,
    "candidate_version_key" VARCHAR(256) NOT NULL,
    "scope_json" JSONB NOT NULL,
    "metrics_json" JSONB NOT NULL,
    "status" "EvolutionExperimentStatus" NOT NULL,
    "result_json" JSONB,
    CONSTRAINT "self_evolution_experiments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "self_evolution_experiments_proposal_id_status_idx" ON "self_evolution_experiments"("proposal_id", "status");
CREATE INDEX "self_evolution_experiments_status_created_at_idx" ON "self_evolution_experiments"("status", "created_at");
ALTER TABLE "self_evolution_experiments" ADD CONSTRAINT "self_evolution_experiments_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "self_evolution_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "self_evolution_promotion_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposal_id" TEXT NOT NULL,
    "decision" "EvolutionEventDecision" NOT NULL,
    "decided_by" "EvolutionEventActor" NOT NULL,
    "decided_by_user_id" TEXT,
    "reason_json" JSONB NOT NULL,
    CONSTRAINT "self_evolution_promotion_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "self_evolution_promotion_events_proposal_id_created_at_idx" ON "self_evolution_promotion_events"("proposal_id", "created_at");
CREATE INDEX "self_evolution_promotion_events_decision_created_at_idx" ON "self_evolution_promotion_events"("decision", "created_at");
ALTER TABLE "self_evolution_promotion_events" ADD CONSTRAINT "self_evolution_promotion_events_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "self_evolution_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "self_evolution_promotion_events" ADD CONSTRAINT "self_evolution_promotion_events_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
