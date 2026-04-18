-- Controlled execution — pending approvals + append-only audit logs.

CREATE TABLE "autonomy_pending_action_approvals" (
    "id" TEXT NOT NULL,
    "run_id" TEXT,
    "proposed_action_id" TEXT NOT NULL,
    "proposed_action_json" JSONB NOT NULL,
    "policy_snapshot_json" JSONB,
    "governance_disposition" TEXT NOT NULL,
    "governance_reason" TEXT,
    "status" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "requested_by_user_id" TEXT,
    "resolved_by_user_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomy_pending_action_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "autonomy_pending_action_approvals_idempotency_key_key" ON "autonomy_pending_action_approvals"("idempotency_key");

CREATE INDEX "autonomy_pending_action_approvals_status_idx" ON "autonomy_pending_action_approvals"("status");

CREATE INDEX "autonomy_pending_action_approvals_created_at_idx" ON "autonomy_pending_action_approvals"("created_at");

CREATE TABLE "autonomy_execution_audit_logs" (
    "id" TEXT NOT NULL,
    "event_kind" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "run_id" TEXT,
    "action_id" TEXT,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomy_execution_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "autonomy_execution_audit_logs_event_kind_created_at_idx" ON "autonomy_execution_audit_logs"("event_kind", "created_at");

CREATE INDEX "autonomy_execution_audit_logs_run_id_idx" ON "autonomy_execution_audit_logs"("run_id");
