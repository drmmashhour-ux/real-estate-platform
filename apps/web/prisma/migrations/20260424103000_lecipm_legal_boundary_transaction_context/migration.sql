-- CreateEnum
CREATE TYPE "LecipmLegalBoundaryEntityType" AS ENUM ('LISTING', 'DEAL', 'BOOKING');

-- CreateEnum
CREATE TYPE "LecipmLegalBoundaryTransactionMode" AS ENUM ('BROKERED', 'FSBO');

-- CreateEnum
CREATE TYPE "LecipmLegalBoundaryComplianceState" AS ENUM ('SAFE', 'RESTRICTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "LecipmLegalBoundaryModeSource" AS ENUM ('AUTO', 'CONVERSION');

-- CreateTable
CREATE TABLE "lecipm_transaction_contexts" (
    "id" TEXT NOT NULL,
    "entity_type" "LecipmLegalBoundaryEntityType" NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "mode" "LecipmLegalBoundaryTransactionMode" NOT NULL,
    "broker_id" VARCHAR(36),
    "compliance_state" "LecipmLegalBoundaryComplianceState" NOT NULL DEFAULT 'SAFE',
    "mode_source" "LecipmLegalBoundaryModeSource" NOT NULL DEFAULT 'AUTO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecipm_transaction_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecipm_legal_boundary_audit_logs" (
    "id" TEXT NOT NULL,
    "action_type" VARCHAR(128) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(32),
    "mode" VARCHAR(16) NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "reason" TEXT NOT NULL,
    "actor_user_id" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecipm_legal_boundary_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lecipm_transaction_contexts_entity_type_entity_id_key" ON "lecipm_transaction_contexts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "lecipm_transaction_contexts_entity_id_idx" ON "lecipm_transaction_contexts"("entity_id");

-- CreateIndex
CREATE INDEX "lecipm_transaction_contexts_broker_id_idx" ON "lecipm_transaction_contexts"("broker_id");

-- CreateIndex
CREATE INDEX "lecipm_legal_boundary_audit_logs_entity_id_created_at_idx" ON "lecipm_legal_boundary_audit_logs"("entity_id", "created_at");

-- CreateIndex
CREATE INDEX "lecipm_legal_boundary_audit_logs_action_type_created_at_idx" ON "lecipm_legal_boundary_audit_logs"("action_type", "created_at");
