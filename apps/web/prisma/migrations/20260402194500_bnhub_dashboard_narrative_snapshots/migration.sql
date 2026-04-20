CREATE TABLE "bnhub_dashboard_narrative_snapshots" (
    "id" TEXT NOT NULL,
    "scope_type" VARCHAR(24) NOT NULL,
    "scope_id" TEXT NOT NULL,
    "period_label" VARCHAR(32) NOT NULL,
    "summary_text" TEXT NOT NULL,
    "facts_json" JSONB,
    "risks_json" JSONB,
    "opportunities_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnhub_dashboard_narrative_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bnhub_dashboard_narrative_snapshots_scope_type_scope_id_period_label_created_at_idx"
  ON "bnhub_dashboard_narrative_snapshots"("scope_type", "scope_id", "period_label", "created_at");
