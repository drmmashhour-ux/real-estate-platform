-- Low-risk growth autonomy execution audit (allowlisted internal actions only)
CREATE TABLE "growth_autonomy_low_risk_executions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operator_user_id" TEXT,
    "catalog_entry_id" TEXT NOT NULL,
    "low_risk_action_key" TEXT NOT NULL,
    "disposition_label" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "operator_visible_result" TEXT NOT NULL,
    "undo_available" BOOLEAN NOT NULL DEFAULT true,
    "reversed_at" TIMESTAMPTZ(6),
    "payload" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "growth_autonomy_low_risk_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_ga_auto_exec_user_time" ON "growth_autonomy_low_risk_executions"("operator_user_id", "created_at");
CREATE INDEX "idx_ga_auto_exec_cat_time" ON "growth_autonomy_low_risk_executions"("catalog_entry_id", "created_at");
