-- Legal Hub reference library + risk event audit (LECIPM compliance engine)

CREATE TABLE "legal_cases" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'QC',
    "summary" TEXT NOT NULL,
    "facts" TEXT NOT NULL,
    "legal_issues" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "seller_liable" BOOLEAN NOT NULL DEFAULT false,
    "broker_liable" BOOLEAN NOT NULL DEFAULT false,
    "latent_defect" BOOLEAN NOT NULL DEFAULT false,
    "bad_faith" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_cases_jurisdiction_idx" ON "legal_cases"("jurisdiction");

CREATE TABLE "legal_rules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "outcome" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_rules_category_idx" ON "legal_rules"("category");

CREATE TABLE "legal_risk_events" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "risk_type" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "flags" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_risk_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_risk_events_entity_type_entity_id_idx" ON "legal_risk_events"("entity_type", "entity_id");
CREATE INDEX "legal_risk_events_created_at_idx" ON "legal_risk_events"("created_at");
